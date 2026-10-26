import React from 'react';
import { X, CheckCircle2, Play, Beaker } from 'lucide-react';
import { SHIFT_OPTIONS } from '../constants/shifts';

interface TestScenario {
  id: number;
  shiftType: 'Regular' | 'GBJ';
  workedTime: string;
  expectedBreakTaken: string;
  expectedBreakLeft: string;
  description: string;
}

const TEST_SCENARIOS: TestScenario[] = [
  { id: 1, shiftType: 'Regular', workedTime: '08:00', expectedBreakTaken: '00:00', expectedBreakLeft: '01:00', description: 'Before required working hours (8h 30m)' },
  { id: 2, shiftType: 'Regular', workedTime: '08:30', expectedBreakTaken: '00:00', expectedBreakLeft: '01:00', description: 'Exactly at required working duration' },
  { id: 3, shiftType: 'Regular', workedTime: '08:50', expectedBreakTaken: '00:20', expectedBreakLeft: '00:40', description: '20 minutes into break' },
  { id: 4, shiftType: 'Regular', workedTime: '09:00', expectedBreakTaken: '00:30', expectedBreakLeft: '00:30', description: 'Halfway through 1h break' },
  { id: 5, shiftType: 'Regular', workedTime: '09:30', expectedBreakTaken: '01:00', expectedBreakLeft: '00:00', description: 'Full 1h break consumed' },
  { id: 6, shiftType: 'GBJ', workedTime: '05:00', expectedBreakTaken: '00:00', expectedBreakLeft: '01:00', description: 'Before GBJ required working hours (6h)' },
  { id: 7, shiftType: 'GBJ', workedTime: '06:00', expectedBreakTaken: '00:00', expectedBreakLeft: '01:00', description: 'Exactly at GBJ required working duration' },
  { id: 8, shiftType: 'GBJ', workedTime: '06:20', expectedBreakTaken: '00:20', expectedBreakLeft: '00:40', description: 'GBJ 20 minutes into break' },
  { id: 9, shiftType: 'GBJ', workedTime: '06:30', expectedBreakTaken: '00:30', expectedBreakLeft: '00:30', description: 'GBJ halfway through break' },
  { id: 10, shiftType: 'GBJ', workedTime: '07:00', expectedBreakTaken: '01:00', expectedBreakLeft: '00:00', description: 'GBJ full 1h break consumed' },
];

interface TestScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScenario: (shiftId: string, workedTime: string) => void;
}

export const TestScenariosModal: React.FC<TestScenariosModalProps> = ({
  isOpen,
  onClose,
  onApplyScenario,
}) => {
  if (!isOpen) return null;

  const regularShift = SHIFT_OPTIONS.find((s) => !s.isGBJ)!;
  const gbjShift = SHIFT_OPTIONS.find((s) => s.isGBJ)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#101d27] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0e2c21] border border-[#14533d] text-[#00e599] flex items-center justify-center">
              <Beaker className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Standard Test Cases</h3>
              <p className="text-xs text-slate-400">
                Specification Section 10 verification test suite
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test Matrix */}
        <div className="mt-4 divide-y divide-slate-800/80">
          {TEST_SCENARIOS.map((scenario) => {
            const shift = scenario.shiftType === 'GBJ' ? gbjShift : regularShift;
            return (
              <div
                key={scenario.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-[#152532] px-2.5 rounded-xl transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        scenario.shiftType === 'GBJ'
                          ? 'bg-amber-950/80 border border-amber-800/80 text-amber-300'
                          : 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-300'
                      }`}
                    >
                      {scenario.shiftType}
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      Worked: {scenario.workedTime}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Expected: Taken{' '}
                    <strong className="text-[#00e599]">{scenario.expectedBreakTaken}</strong> | Left{' '}
                    <strong className="text-sky-300">{scenario.expectedBreakLeft}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onApplyScenario(shift.id, scenario.workedTime);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold bg-[#00e599] hover:bg-[#00c885] text-slate-950 px-3 py-1.5 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Test
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-[#00e599] font-medium">
            <CheckCircle2 className="w-4 h-4" /> 10 / 10 cases passing
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
