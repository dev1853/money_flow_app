// frontend/src/pages/HelpPage.jsx
import React from 'react';
import PageTitle from '../components/PageTitle'; // Используем существующий компонент заголовка

function HelpPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <PageTitle title="Помощь и Инструкции" className="mb-6" />
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Добро пожаловать в Руководство пользователя!</h2>
        <p className="text-gray-700">
          Здесь вы найдете краткие инструкции по использованию основных функций приложения "БизнесПоток".
        </p>

        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-2">1. Вход и регистрация</h3>
          <p className="text-gray-700">
            Для начала работы вам необходимо зарегистрироваться или войти в существующий аккаунт. Если у вас несколько компаний, вы сможете переключаться между ними после входа.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-2">2. Управление счетами</h3>
          <p className="text-gray-700">
            Перейдите в раздел "Счета". Здесь вы можете добавлять, редактировать и просматривать балансы ваших денежных счетов (касса, банк, электронные кошельки).
          </p>
        </section>

        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-2">3. Ввод транзакций</h3>
          <p className="text-gray-700">
            <span className="font-semibold">Быстрый расход:</span> Нажмите иконку "Быстрый расход" (в мобильной версии в шапке, на десктопе в сайдбаре), чтобы быстро зафиксировать расход наличными.
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Новая транзакция:</span> Перейдите в раздел "Транзакции". Здесь вы можете добавлять доходы и расходы, указывая счет, сумму, описание, дату и статью ДДС.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-2">4. Автоматическое разнесение платежей</h3>
          <p className="text-gray-700">
            Система может автоматически присваивать статьи ДДС вашим транзакциям!
            Перейдите в "Настройки" &gt; "Правила разнесения". Здесь вы можете создавать правила, указывая ключевое слово в описании транзакции и статью ДДС. Если при создании транзакции описание содержит ключевое слово из активного правила, статья ДДС будет присвоена автоматически.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-2">5. Загрузка банковских выписок</h3>
          <p className="text-gray-700">
            Для автоматического импорта множества транзакций вы можете загружать банковские выписки в формате CSV. Нажмите кнопку "Выписка" на странице "Транзакции", выберите файл и счет, к которому относится выписка. Система сама разберет и импортирует транзакции.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-2">6. Отчеты</h3>
          <p className="text-gray-700">
            В разделе "Отчеты" вы найдете финансовую аналитику:
            <ul className="list-disc pl-5 mt-1">
              <li><span className="font-semibold">Движение ДС (ДДС):</span> Покажет, откуда и куда двигались деньги за выбранный период. Вы можете кликнуть на статью для детализации.</li>
              <li><span className="font-semibold">Прибыли и Убытки (ОПиУ):</span> Отобразит общий доход и расходы за период, показывая финансовый результат.</li>
            </ul>
          </p>
        </section>

        <p className="text-gray-700 mt-6">
          Если у вас возникнут вопросы, пожалуйста, свяжитесь с поддержкой.
        </p>
      </div>
    </div>
  );
}

export default HelpPage;