import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

const ONBOARDING_STEPS = [
  { key: 'account', label: 'Создайте первый счет' },
  { key: 'transaction', label: 'Добавьте первую транзакцию' },
  { key: 'calendar', label: 'Запланируйте платеж в календаре' },
  { key: 'report', label: 'Посмотрите отчет' },
  { key: 'faq', label: 'Ознакомьтесь с разделом помощи' },
];

const STORAGE_KEY = 'onboardingChecklistV1';

function getInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { completed: [], collapsed: false, dismissed: false };
}

function OnboardingChecklist() {
  const [state, setState] = useState(getInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  if (state.dismissed) return null;

  const progress = Math.round((state.completed.length / ONBOARDING_STEPS.length) * 100);
  const allDone = state.completed.length === ONBOARDING_STEPS.length;

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-80 max-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl transition-all animate-fade-in-up ${state.collapsed ? 'h-14 overflow-hidden' : ''}`}>
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setState(s => ({ ...s, collapsed: !s.collapsed }))}>
        <div className="flex items-center gap-2">
          <CheckCircleIcon className={`h-6 w-6 ${allDone ? 'text-green-500' : 'text-indigo-500'}`} />
          <span className="font-semibold text-gray-900 dark:text-gray-100">Первые шаги</span>
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{progress}%</span>
        </div>
        <div className="flex items-center gap-2">
          <ChevronDownIcon className={`h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform ${state.collapsed ? '-rotate-90' : ''}`} />
          <button className="ml-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={e => { e.stopPropagation(); setState(s => ({ ...s, dismissed: true })); }} title="Скрыть чек-лист">
            <XMarkIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </button>
        </div>
      </div>
      {!state.collapsed && (
        <div className="px-4 pb-4">
          <ol className="space-y-2 mt-2">
            {ONBOARDING_STEPS.map(step => (
              <li key={step.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={state.completed.includes(step.key)}
                  onChange={() => setState(s => ({
                    ...s,
                    completed: s.completed.includes(step.key)
                      ? s.completed.filter(k => k !== step.key)
                      : [...s.completed, step.key],
                  }))}
                  className="accent-indigo-500 h-4 w-4 rounded"
                  id={`onboarding-step-${step.key}`}
                />
                <label htmlFor={`onboarding-step-${step.key}`} className={`text-sm ${state.completed.includes(step.key) ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>{step.label}</label>
              </li>
            ))}
          </ol>
          {allDone && <div className="mt-4 text-green-600 dark:text-green-400 text-sm font-semibold">Поздравляем! Вы освоили базовые функции 🎉</div>}
        </div>
      )}
    </div>
  );
}

export default OnboardingChecklist; 