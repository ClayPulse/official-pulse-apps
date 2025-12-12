import {
  useRegisterAction,
  useSnapshotState,
  useTheme,
} from "@pulse-editor/react-api";
import React, { useMemo, useState } from "react";
import { preRegisteredActions } from "./actions";

const COLORS = [
  "#fde047", // yellow-300
  "#93c5fd", // blue-300
  "#fca5a5", // red-300
  "#86efac", // green-300
  "#a5b4fc", // indigo-300
  "#f9a8d4", // pink-300
];

const WHEEL_PX = 320;
const RADIUS = WHEEL_PX / 2;
const LABEL_RADIUS = Math.round(RADIUS * 0.65); // closer to center for balance

const norm360 = (deg: number) => ((deg % 360) + 360) % 360;

function getPrizeIndexFromRotation(rotation: number, n: number): number {
  const sliceAngle = 360 / n;
  const activeAngle = norm360(360 - norm360(rotation - 90)); // top angle
  return Math.floor(activeAngle / sliceAngle) % n;
}

const SpinWheel: React.FC = () => {
  const [optionsInput, setOptionsInput] = useSnapshotState<string>(
    "options-input",
    "🎉 Free Coffee, 🍕 Pizza, 🎁 Gift Card, 🍫 Chocolate, 🛍️ Discount, ❌ Try Again",
    (restoredValue) => {
      console.log("Options input changed:", restoredValue);
      const items = restoredValue
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.length > 0) {
        setOptions(() => items);
        setSelectedPrize(() => null);
      }
    }
  );

  const [options, setOptions] = useState<string[]>(
    optionsInput.split(",").map((s) => s.trim())
  );

  const [rotation, setRotation] = useState<number>(90);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [selectedPrize, setSelectedPrize] = useState<string | null>(null);

  const [count, setCount] = useState(0);

  useRegisterAction(
    preRegisteredActions["spin-wheel"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    async (args: any) => {
      if (!spinning) {
        console.log("Spinning the wheel!", count);
        setCount(count + 1);
        // Wait before spinning to allow UI to update
        const result = await spin();
        return { result };
      }
    },
    [count, spinning, options]
  );
  const { theme } = useTheme();

  const sliceAngle = 360 / options.length;

  const background = useMemo(() => {
    const stops = options
      .map((_, i) => {
        const start = i * sliceAngle;
        const end = (i + 1) * sliceAngle;
        const color = COLORS[i % COLORS.length];
        return `${color} ${start}deg ${end}deg`;
      })
      .join(", ");
    return `conic-gradient(from -90deg, ${stops})`;
  }, [options.length, sliceAngle]);

  async function spin() {
    if (spinning || options.length === 0) return;

    setSpinning(true);
    setSelectedPrize(null);

    const randomStop = Math.random() * 360; // anywhere
    const spins = 5 + Math.floor(Math.random() * 3); // 5–7 spins
    const delta = spins * 360 + randomStop;

    const finalRotation = rotation + delta;
    setRotation(finalRotation);

    await new Promise((resolve) => setTimeout(resolve, 5000));
    const index = getPrizeIndexFromRotation(finalRotation, options.length);
    setSelectedPrize(options[index]);
    setSpinning(false);

    return options[index];
  }

  const handleUpdateOptions = () => {
    const items = optionsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length > 0) {
      setOptions(() => items);
      setSelectedPrize(() => null);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br data-[theme=light]:from-indigo-200 data-[theme=light]:to-pink-200 data-[theme=dark]:from-gray-800 data-[theme=dark]:to-gray-900 p-6 gap-6"
      data-theme={theme}
    >
      {/* Input */}
      <div className="w-full max-w-md flex flex-col items-center">
        <label
          className="block mb-2 text-sm font-semibold text-gray-700 data-[theme=dark]:text-gray-300"
          data-theme={theme}
        >
          Enter options (comma-separated):
        </label>
        <textarea
          value={optionsInput}
          onChange={(e) => setOptionsInput(e.target.value)}
          rows={2}
          className="w-full p-2 border rounded-lg shadow-sm focus:ring focus:ring-indigo-300 data-[theme=dark]:bg-gray-700 data-[theme=dark]:border-gray-600 data-[theme=dark]:text-gray-200"
          data-theme={theme}
        />
        <button
          onClick={handleUpdateOptions}
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 data-[theme=dark]:bg-green-700 data-[theme=dark]:hover:bg-green-800"
          data-theme={theme}
        >
          Update Wheel
        </button>
      </div>

      {/* Wheel */}
      <div className="relative">
        <div
          className="w-80 h-80 rounded-full border-[6px] border-gray-700 shadow-lg transition-transform duration-[5000ms] ease-out relative"
          style={{ transform: `rotate(${rotation}deg)`, background }}
        >
          {options.map((prize, i) => {
            // Center the label by rotating to the slice midpoint, then subtracting half the slice angle
            const centerAngle = (i + 0.5) * sliceAngle - 180; // true slice midpoint adjusted for CSS coords
            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2"
                style={{
                  transform: `translate(-50%, -50%) rotate(${centerAngle}deg) translateX(${LABEL_RADIUS}px) rotate(90deg)`,
                }}
              >
                <span className="block max-w-[100px] text-center text-[12px] font-semibold text-gray-800 leading-tight">
                  {prize}
                </span>
              </div>
            );
          })}
        </div>

        {/* Pointer */}
        <div
          className="absolute top-1 left-1/2 -translate-x-1/2 w-0 h-0
                     border-l-[12px] border-r-[12px] border-t-[24px]
                     border-l-transparent border-r-transparent border-t-red-600 drop-shadow"
        />
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={spinning || options.length === 0}
        className="px-6 py-2 rounded-2xl bg-indigo-600 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {spinning ? "Spinning..." : "Spin"}
      </button>

      {selectedPrize && (
        <p
          className="mt-2 text-lg font-bold text-gray-800 data-[theme=dark]:text-gray-200"
          data-theme={theme}
        >
          You won: {selectedPrize} 🎊
        </p>
      )}
    </div>
  );
};

export default SpinWheel;
