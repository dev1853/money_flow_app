import os
import requests
import random
import json
import logging

YANDEX_API_KEY = os.getenv("YANDEX_API_KEY")
YANDEX_IAM_TOKEN = os.getenv("YANDEX_IAM_TOKEN")
YANDEX_FOLDER_ID = os.getenv("YANDEX_FOLDER_ID")

# Функция для вызова YandexGPT

def yandex_gpt_categorize(description, amount):
    prompt = (
        f"Категоризируй расход: '{description}', сумма: {amount}. "
        "Верни только название категории, без пояснений."
    )
    if YANDEX_IAM_TOKEN:
        auth_header = f"Bearer {YANDEX_IAM_TOKEN}"
    else:
        auth_header = f"Api-Key {YANDEX_API_KEY}"
    headers = {
        "Authorization": auth_header,
        "Content-Type": "application/json"
    }
    data = {
        "modelUri": f"gpt://{YANDEX_FOLDER_ID}/yandexgpt-lite",
        "completionOptions": {"stream": False, "temperature": 0.1, "maxTokens": 20},
        "messages": [{"role": "user", "text": prompt}]
    }
    resp = requests.post(
        "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
        json=data, headers=headers, timeout=10
    )
    resp.raise_for_status()
    result = resp.json()
    return result['result']['alternatives'][0]['message']['text'].strip()

# Загрузка категорий для альтернатив (опционально)
CATEGORIES_PATH = os.path.join(os.path.dirname(__file__), '../initial_data/categories.json')
with open(CATEGORIES_PATH, encoding='utf-8') as f:
    CATEGORIES = json.load(f)

def ml_categorize_transaction(description: str, amount: float):
    logger = logging.getLogger(__name__)
    logger.info(f"ML Categorization request: description='{description}', amount={amount}")
    try:
        category = yandex_gpt_categorize(description, amount)
        logger.info(f"YandexGPT response: category='{category}'")
        # Альтернативы — случайные категории, кроме основной
        alternatives = random.sample([c for c in CATEGORIES if c != category], k=min(3, len(CATEGORIES)-1))
        logger.info(f"ML Categorization result: category='{category}', confidence=0.95, alternatives={alternatives}")
        return category, 0.95, alternatives
    except Exception as e:
        logger.error(f"YandexGPT call failed: {e}", exc_info=True)
        # Fallback: если облако недоступно — вернуть "Прочее"
        logger.info("ML Categorization fallback: category='Прочее', confidence=0.0, alternatives=[]")
        return "Прочее", 0.0, [] 