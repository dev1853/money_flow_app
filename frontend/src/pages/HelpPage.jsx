// frontend/src/pages/HelpPage.jsx

import React, { useState, useMemo } from 'react';
import PageTitle from '../components/PageTitle';
import { 
    HomeIcon, 
    BanknotesIcon, 
    CalendarDaysIcon, 
    CalculatorIcon, 
    DocumentChartBarIcon,
    ChevronDownIcon
} from '@heroicons/react/24/solid'; // Используем solid иконки для лучшей видимости
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

// --- УЛУЧШЕННЫЙ КОМПОНЕНТ HelpTopic (теперь это аккордеон) ---
const HelpTopic = ({ icon: Icon, question, children, initiallyOpen = false }) => {
    const [isOpen, setIsOpen] = useState(initiallyOpen);

    return (
        // Адаптируем фон, границу и тень контейнера
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-2xl dark:shadow-indigo-500/10 border border-gray-200 dark:border-gray-700">
            {/* Кликабельный заголовок для открытия/закрытия */}
            <button
                className="flex justify-between items-center w-full p-4 text-left"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center">
                    {/* Адаптируем иконку */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                        <Icon className="h-6 w-6" />
                    </div>
                    {/* Адаптируем текст вопроса */}
                    <h3 className="ml-4 font-bold text-gray-900 dark:text-gray-100 text-lg">
                        {question}
                    </h3>
                </div>
                <ChevronDownIcon
                    className={`h-6 w-6 text-gray-500 dark:text-gray-400 transform transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {/* Раскрывающийся контент с плавной анимацией */}
            <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-screen' : 'max-h-0'
                }`}
            >
                <div className="p-4 pt-0">
                    {/* Адаптируем стили текста ответа */}
                    <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-300 dark:prose-invert">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};


const HELP_TOPICS = [
  {
    key: 'basics',
    icon: HomeIcon,
    question: 'С чего начать? (Сводка)',
    category: 'Основы',
    content: (
      <>
        <p>Это ваш главный экран, который дает быстрый обзор финансового состояния. Обращайте внимание на:</p>
        <ul>
            <li><strong>Остатки на счетах:</strong> Общая сумма денег.</li>
            <li><strong>Прибыль и убыток:</strong> Ключевые показатели эффективности.</li>
            <li><strong>Графики:</strong> Визуальное представление доходов и расходов.</li>
        </ul>
      </>
    ),
  },
  {
    key: 'accounts',
    icon: BanknotesIcon,
    question: 'Как учитывать деньги? (Счета и Транзакции)',
    category: 'Счета',
    content: (
      <>
        <p>Все начинается с правильного учета операций. Сначала создайте <strong>"Счета"</strong> — это ваши реальные кошельки (расчетный счет, касса, карта).</p>
        <p>Затем фиксируйте все движения денег как <strong>"Транзакции"</strong>:</p>
        <ul>
            <li><strong>Доход:</strong> Поступления денег.</li>
            <li><strong>Расход:</strong> Траты денег.</li>
            <li><strong>Перевод:</strong> Перемещение между своими счетами.</li>
        </ul>
        <p><strong>Важно:</strong> Привязывайте каждую транзакцию к "Статье ДДС", чтобы отчеты были точными.</p>
      </>
    ),
  },
  {
    key: 'calendar',
    icon: CalendarDaysIcon,
    question: 'Как прогнозировать кассовые разрывы? (Платежный календарь)',
    category: 'Календарь',
    content: (
      <>
        <p>Это ваш финансовый прогноз. Он показывает, хватит ли вам денег на будущие обязательные платежи.</p>
        <ol>
            <li>Перейдите в <strong>"Платежный календарь"</strong> и выберите период.</li>
            <li>Кликните по любому дню, чтобы <strong>запланировать</strong> будущий доход или расход (например, аренду, зарплату).</li>
            <li>Следите за ячейками, подсвеченными <strong>красным</strong>. Это и есть кассовые разрывы — дни, когда денег на счетах может не хватить.</li>
        </ol>
      </>
    ),
  },
  {
    key: 'budget',
    icon: CalculatorIcon,
    question: 'Как контролировать расходы? (Бюджетирование)',
    category: 'Бюджет',
    content: (
      <>
        <p>Бюджет — это ваш план расходов на месяц или квартал. Он помогает не тратить лишнего.</p>
        <ul>
            <li><strong>Создайте бюджет:</strong> Запланируйте, сколько вы собираетесь потратить по каждой статье (например, "Аренда - 50 000 ₽", "Зарплаты - 150 000 ₽").</li>
            <li><strong>Следите за исполнением:</strong> Приложение автоматически сравнит ваш план с фактическими расходами и покажет отклонение. Зеленое отклонение — экономия, красное — перерасход.</li>
        </ul>
      </>
    ),
  },
  {
    key: 'reports',
    icon: DocumentChartBarIcon,
    question: 'Как анализировать результаты? (Отчеты)',
    category: 'Отчеты',
    content: (
      <>
        <p>В приложении есть два главных отчета:</p>
        <ul>
            <li><strong>ДДС (Движение денежных средств):</strong> Отвечает на вопрос "Сколько у меня реальных денег и куда они ушли?".</li>
            <li><strong>P&L (Прибыли и убытки):</strong> Отвечает на вопрос "Эффективен ли мой бизнес?". Показывает, заработали ли вы, даже если деньги еще не пришли на счет.</li>
        </ul>
      </>
    ),
  },
];

const CATEGORIES = ['Все', 'Основы', 'Счета', 'Календарь', 'Бюджет', 'Отчеты'];


function HelpPage() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Все');

    const filteredTopics = useMemo(() => {
        return HELP_TOPICS.filter(topic =>
            (category === 'Все' || topic.category === category) &&
            (search.trim() === '' || topic.question.toLowerCase().includes(search.trim().toLowerCase()) || (typeof topic.content === 'string' && topic.content.toLowerCase().includes(search.trim().toLowerCase())))
        );
    }, [search, category]);

    return (
        <div className="animate-fade-in-up">
            <PageTitle title="Центр помощи" />
            <p className="mt-2 mb-8 text-gray-600 dark:text-gray-400">
                Привет! Я ваш личный помощник. Ниже я ответил на самые популярные вопросы о работе с приложением.
            </p>

            {/* Поиск и табы */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-6">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Поиск по вопросам..."
                    className="w-full md:w-72 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <div className="flex flex-wrap gap-1 md:ml-4">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${category === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-800'}`}
                            onClick={() => setCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Call to action */}
            <div className="flex items-center gap-3 mb-8 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-200 dark:border-indigo-700">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-500 dark:text-indigo-300" />
                <span className="text-indigo-900 dark:text-indigo-100 font-medium">Не нашли ответа? <a href="mailto:support@myapp.ru" className="underline hover:text-indigo-700 dark:hover:text-indigo-200">Задайте вопрос поддержке</a></span>
            </div>

            <div className="space-y-4">
                {filteredTopics.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-12 text-lg">Вопросы не найдены.</div>
                ) : (
                    filteredTopics.map(topic => (
                        <HelpTopic
                            key={topic.key}
                            icon={topic.icon}
                            question={topic.question}
                        >
                            {topic.content}
                        </HelpTopic>
                    ))
                )}
            </div>
        </div>
    );
}

export default HelpPage;