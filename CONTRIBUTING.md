# Contributing to Hyperscaler

Thank you for your interest in contributing to **Hyperscaler**! We welcome bug reports, feature suggestions, architecture simulations, and pull requests.

---

## 🛠️ Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/grzegorzf/hyperscaler.git
   cd hyperscaler
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start the local development server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (or specified port) to view the simulator.

---

## 🧪 Testing & Validation Guidelines

Before submitting a pull request, ensure all automated tests and type checks pass cleanly:

```bash
# Run automated test suite (all 47 tests across 10 suites)
pnpm test

# Run TypeScript static typecheck
pnpm typecheck

# Verify production static build
pnpm build
```

If you add new simulation math, layout algorithms, FinOps calculations, or UI state transitions, please include corresponding unit tests in `tests/`.

---

## 📐 Project Structure

- `src/lib/simulation/`: Pure physics, queuing math, and state transition logic.
- `src/lib/canvas/renderers/`: Modular 60 FPS HTML5 canvas drawing functions.
- `src/components/`: Cybernetic UI controls, sliders, HUD telemetry, and canvas wrappers.
- `src/hooks/`: React state binding and hooks.
- `tests/`: Zero-dependency test suites running natively via Node 22 test runner.

---

## 🚀 Pull Request Workflow

1. Fork the repo and create a new feature branch:
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. Commit your changes with clear, descriptive commit messages.
3. Verify tests and build pass locally:
   ```bash
   npm test
   pnpm build
   ```
4. Push to your fork and submit a Pull Request.

---

## 📄 Code of Conduct

Please be respectful, constructive, and collaborative in all issues and pull requests.
