from flask import Flask, request, jsonify
from flask_cors import CORS
import math

app = Flask(__name__)
CORS(app)


def dies_per_wafer(wafer_diameter_mm: float, die_area_mm2: float) -> float:
    """
    Approximate Gross Dies Per Wafer (DPW):
    DPW = (pi * (D/2)^2 / A) - (pi * D / sqrt(2*A))
    """
    wafer_area = math.pi * (wafer_diameter_mm / 2) ** 2
    edge_loss = math.pi * wafer_diameter_mm / math.sqrt(2 * die_area_mm2)
    return max((wafer_area / die_area_mm2) - edge_loss, 0)


def murphy_yield(die_area_mm2: float, defect_density_per_cm2: float) -> float:
    """
    Murphy model (triangular):
    Y = ((1 - exp(-D0 * A_cm2)) / (D0 * A_cm2))^2
    """
    area_cm2 = die_area_mm2 / 100.0
    x = defect_density_per_cm2 * area_cm2
    if x == 0:
        return 1.0
    return ((1 - math.exp(-x)) / x) ** 2


def bose_einstein_yield(die_area_mm2: float, defect_density_per_cm2: float) -> float:
    """
    Common clustering variant (alpha=1):
    Y = 1 / (1 + D0 * A_cm2)
    """
    area_cm2 = die_area_mm2 / 100.0
    return 1.0 / (1.0 + defect_density_per_cm2 * area_cm2)


def good_dies_per_wafer(wafer_diameter_mm: float, die_area_mm2: float, defect_density_per_cm2: float, model: str) -> float:
    dpw = dies_per_wafer(wafer_diameter_mm, die_area_mm2)
    y = murphy_yield(die_area_mm2, defect_density_per_cm2) if model == "murphy" else bose_einstein_yield(die_area_mm2, defect_density_per_cm2)
    return dpw * y


def cost_per_die(wafer_cost_usd: float, good_dies: float, packaging_cost_usd: float = 0.0, test_cost_usd: float = 0.0) -> float:
    if good_dies <= 0:
        return float("inf")
    return wafer_cost_usd / good_dies + packaging_cost_usd + test_cost_usd


@app.post('/api/calculate')
def calculate():
    payload = request.get_json(force=True)

    wafer_diameter = float(payload['waferDiameterMm'])
    die_area = float(payload['dieAreaMm2'])
    defect_density = float(payload['defectDensityPerCm2'])
    wafer_cost = float(payload['waferCostUsd'])
    packaging_cost = float(payload.get('packagingCostUsd', 0))
    test_cost = float(payload.get('testCostUsd', 0))
    model = payload.get('yieldModel', 'murphy').lower()

    dpw = dies_per_wafer(wafer_diameter, die_area)
    y = murphy_yield(die_area, defect_density) if model == 'murphy' else bose_einstein_yield(die_area, defect_density)
    good_dies = dpw * y
    cpd = cost_per_die(wafer_cost, good_dies, packaging_cost, test_cost)

    return jsonify({
        'diesPerWafer': dpw,
        'yield': y,
        'goodDiesPerWafer': good_dies,
        'costPerDieUsd': cpd,
        'yieldModelUsed': model
    })


@app.post('/api/compare-chiplet')
def compare_chiplet():
    payload = request.get_json(force=True)

    wafer_diameter = float(payload['waferDiameterMm'])
    defect_density = float(payload['defectDensityPerCm2'])
    wafer_cost = float(payload['waferCostUsd'])
    yield_model = payload.get('yieldModel', 'murphy').lower()

    mono_die_area = float(payload['monolithicDieAreaMm2'])

    chiplet_die_area = float(payload['chipletDieAreaMm2'])
    chiplets_per_package = int(payload['chipletsPerPackage'])
    advanced_packaging_cost = float(payload.get('advancedPackagingUsd', 8.0))

    mono_good = good_dies_per_wafer(wafer_diameter, mono_die_area, defect_density, yield_model)
    mono_cost = cost_per_die(wafer_cost, mono_good, packaging_cost_usd=2.0, test_cost_usd=1.0)

    chiplet_good = good_dies_per_wafer(wafer_diameter, chiplet_die_area, defect_density, yield_model)
    chiplet_cost_each = cost_per_die(wafer_cost, chiplet_good)
    chiplet_pkg_cost = chiplets_per_package * chiplet_cost_each + advanced_packaging_cost + 2.0

    return jsonify({
        'monolithic': {
            'dieAreaMm2': mono_die_area,
            'goodDiesPerWafer': mono_good,
            'estimatedCostPerPackageUsd': mono_cost
        },
        'chiplet': {
            'chipletAreaMm2': chiplet_die_area,
            'chipletsPerPackage': chiplets_per_package,
            'goodChipletsPerWafer': chiplet_good,
            'estimatedCostPerPackageUsd': chiplet_pkg_cost
        },
        'deltaUsd': mono_cost - chiplet_pkg_cost
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
