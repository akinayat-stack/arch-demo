# Chip Fabrication Cost Calculator (Team: chipset)

## Architecture (3 blocks, 2 students each)

### Part 1 — Mathematical Model & Backend API
**Members:** Askhan Moldir, Kinayatova Aruzhan
- Flask API with two endpoints:
  - `POST /api/calculate` for DPW, yield, good dies, cost per die.
  - `POST /api/compare-chiplet` for monolithic vs chiplet package cost.
- Core formulas:
  - DPW (gross dies per wafer) with edge correction.
  - Yield models: Murphy, Bose-Einstein (clustered defects approximation).
  - Cost per die = wafer cost / good dies + package + test.

### Part 2 — Frontend UI & Interactive Visualization
**Members:** Bairakimova Galiya, Abdumalik Zhanerke
- Single-page HTML + JS app.
- Inputs for wafer diameter, die area, defect density, wafer cost, and yield model.
- Canvas-based wafer with die tiles colored by simulated pass/fail using computed yield.

### Part 3 — Real Chips Data, Comparison, Documentation
**Members:** Tolegenova Moldir, Kudaibergen Nazerke
- Real chip baseline dataset in `data/real_chips.csv`.
- Scenario comparison scripts/pages can iterate over this CSV and call backend.
- Documentation files: `README.md`, `AI_USAGE.md`, and slide deck outline in `docs/slides_outline.md`.

## Run
```bash
pip install flask flask-cors
python backend/app.py
# open frontend/index.html in browser
```
