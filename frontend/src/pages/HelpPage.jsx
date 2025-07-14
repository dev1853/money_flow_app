// frontend/src/pages/HelpPage.jsx

import React, { useState } from 'react';
import PageTitle from '../components/PageTitle';
import { 
    HomeIcon, 
    BanknotesIcon, 
    CalendarDaysIcon, 
    CalculatorIcon, 
    DocumentChartBarIcon,
    ChevronDownIcon
} from '@heroicons/react/24/solid'; // Используем solid иконки для лучшей видимости

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


function HelpPage() {
    return (
        <div>
            <PageTitle title="Центр помощи" />
            <p className="mt-2 mb-8 text-gray-600 dark:text-gray-400">
                Привет! Я ваш личный помощник. Ниже я ответил на самые популярные вопросы о работе с приложением.
            </p>

            <div className="space-y-4">
                
                <HelpTopic icon={HomeIcon} question="С чего начать? (Сводка)" initiallyOpen={true}>
                    <p>Это ваш главный экран, который дает быстрый обзор финансового состояния. Обращайте внимание на:</p>
                    <ul>
                        <li><strong>Остатки на счетах:</strong> Общая сумма денег.</li>
                        <li><strong>Прибыль и убыток:</strong> Ключевые показатели эффективности.</li>
                        <li><strong>Графики:</strong> Визуальное представление доходов и расходов.</li>
                    </ul>
                </HelpTopic>
                
                <HelpTopic icon={BanknotesIcon} question="Как учитывать деньги? (Счета и Транзакции)">
                    <p>Все начинается с правильного учета операций. Сначала создайте <strong>"Счета"</strong> — это ваши реальные кошельки (расчетный счет, касса, карта).</p>
                    <p>Затем фиксируйте все движения денег как <strong>"Транзакции"</strong>:</p>
                    <ul>
                        <li><strong>Доход:</strong> Поступления денег.</li>
                        <li><strong>Расход:</strong> Траты денег.</li>
                        <li><strong>Перевод:</strong> Перемещение между своими счетами.</li>
                    </ul>
                     <p><strong>Важно:</strong> Привязывайте каждую транзакцию к "Статье ДДС", чтобы отчеты были точными.</p>
                </HelpTopic>

                <HelpTopic icon={CalendarDaysIcon} question="Как прогнозировать кассовые разрывы? (Платежный календарь)">
                     <p>Это ваш финансовый прогноз. Он показывает, хватит ли вам денег на будущие обязательные платежи.</p>
                     <ol>
                        <li>Перейдите в <strong>"Платежный календарь"</strong> и выберите период.</li>
                        <li>Кликните по любому дню, чтобы <strong>запланировать</strong> будущий доход или расход (например, аренду, зарплату).</li>
                        <li>Следите за ячейками, подсвеченными <strong>красным</strong>. Это и есть кассовые разрывы — дни, когда денег на счетах может не хватить.</li>
                     </ol>
                </HelpTopic>

                <HelpTopic icon={CalculatorIcon} question="Как контролировать расходы? (Бюджетирование)">
                    <p>Бюджет — это ваш план расходов на месяц или квартал. Он помогает не тратить лишнего.</p>
                     <ul>
                        <li><strong>Создайте бюджет:</strong> Запланируйте, сколько вы собираетесь потратить по каждой статье (например, "Аренда - 50 000 ₽", "Зарплаты - 150 000 ₽").</li>
                        <li><strong>Следите за исполнением:</strong> Приложение автоматически сравнит ваш план с фактическими расходами и покажет отклонение. Зеленое отклонение — экономия, красное — перерасход.</li>
                    </ul>
                </HelpTopic>

                <HelpTopic icon={DocumentChartBarIcon} question="Как анализировать результаты? (Отчеты)">
                     <p>В приложении есть два главных отчета:</p>
                     <ul>
                        <li><strong>ДДС (Движение денежных средств):</strong> Отвечает на вопрос "Сколько у меня реальных денег и куда они ушли?".</li>
                        <li><strong>P&L (Прибыли и убытки):</strong> Отвечает на вопрос "Эффективен ли мой бизнес?". Показывает, заработали ли вы, даже если деньги еще не пришли на счет.</li>
                     </ul>
                </HelpTopic>

            </div>
        </div>
    );
}

export default HelpPage;