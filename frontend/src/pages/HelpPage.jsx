// frontend/src/pages/HelpPage.jsx

import React from 'react';
import PageTitle from '../components/PageTitle';
import { 
    HomeIcon, 
    BanknotesIcon, 
    CalendarDaysIcon, 
    CalculatorIcon, 
    DocumentChartBarIcon 
} from '@heroicons/react/24/outline';

// Вспомогательный компонент для одного "сообщения" в нашей ленте помощи
const HelpTopic = ({ icon, question, children }) => {
    return (
        <div className="flex items-start space-x-4 py-4">
            {/* Аватар-иконка */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600">
                {React.createElement(icon, { className: "h-6 w-6" })}
            </div>

            {/* "Сообщение" с ответом */}
            <div className="flex-grow bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 text-lg mb-2">{question}</h3>
                <div className="prose prose-sm max-w-none text-gray-600">
                    {children}
                </div>
            </div>
        </div>
    );
};


function HelpPage() {
    return (
        <div>
            <PageTitle title="Центр помощи" />
            <p className="mt-2 mb-8 text-gray-600">
                Привет! Я ваш личный помощник. Ниже я ответил на самые популярные вопросы о работе с приложением.
            </p>

            <div className="space-y-4">
                
                <HelpTopic icon={HomeIcon} question="С чего начать? (Сводка)">
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