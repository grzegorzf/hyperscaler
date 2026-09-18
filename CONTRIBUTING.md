# Contributing to Hyperscaler

Thank you for your interest in contributing to **Hyperscaler**! We welcome bug reports, feature suggestions, architecture simulations, and pull requests.

---

## 🛠️ Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/hyperscaler.git
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
   Open [http://localhost:3000](http://localhost:3000) to view the simulator.

---

## 🧪 Testing Guidelines

Before submitting a pull request, ensure all automated tests pass:

```bash
npm test
# or
node --test --experimental-strip-types tests/**/*.test.ts
```

If you add new math, layout algorithms, or state transitions, please include corresponding unit tests in `tests/`.

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
