# /app/core/logging_config.py (Исправленная версия)

import logging
import os
from logging.config import dictConfig

LOGS_DIR = "logs"
LOG_FILE = os.path.join(LOGS_DIR, "app.log")
ACCESS_LOG_FILE = os.path.join(LOGS_DIR, "access.log") # Отдельный файл для логов доступа

formatters = {
    "default": {
        "format": "%(asctime)s - %(levelname)s - %(name)s - %(message)s",
        "datefmt": "%Y-%m-%d %H:%M:%S",
    },
    "access": {
        # Этот форматтер используется только для uvicorn.access
        "format": "%(asctime)s - %(levelname)s - %(name)s - Client: %(client_addr)s - Request: \"%(request_line)s\" - Status: %(status_code)s",
        "datefmt": "%Y-%m-%d %H:%M:%S",
    },
}

handlers = {
    # Обработчик для стандартных логов (консоль)
    "default_console": {
        "formatter": "default",
        "class": "logging.StreamHandler",
        "stream": "ext://sys.stderr",
    },
    # Обработчик для логов доступа (консоль)
    "access_console": {
        "formatter": "access",
        "class": "logging.StreamHandler",
        "stream": "ext://sys.stdout",
    },
    # Обработчик для стандартных логов (файл)
    "default_file": {
        "formatter": "default",
        "class": "logging.handlers.RotatingFileHandler",
        "filename": LOG_FILE,
        "maxBytes": 1024 * 1024 * 5,
        "backupCount": 3,
    },
    # Обработчик для логов доступа (файл)
    "access_file": {
        "formatter": "access",
        "class": "logging.handlers.RotatingFileHandler",
        "filename": ACCESS_LOG_FILE,
        "maxBytes": 1024 * 1024 * 5,
        "backupCount": 3,
    },
}

loggers = {
    # Логгеры для нашего приложения и ошибок uvicorn используют 'default' форматтер
    "app": {"handlers": ["default_console", "default_file"], "level": "INFO", "propagate": False},
    "sqlalchemy.engine": {"handlers": ["default_console", "default_file"], "level": "WARNING", "propagate": False},
    "uvicorn": {"handlers": ["default_console", "default_file"], "level": "INFO", "propagate": False},
    "uvicorn.error": {"handlers": ["default_console", "default_file"], "level": "INFO", "propagate": False},
    
    # Логгер uvicorn.access использует ИСКЛЮЧИТЕЛЬНО 'access' форматтер
    "uvicorn.access": {"handlers": ["access_console", "access_file"], "level": "INFO", "propagate": False},
}


def setup_logging():
    os.makedirs(LOGS_DIR, exist_ok=True)
    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": formatters,
        "handlers": handlers,
        "loggers": loggers,
    }
    dictConfig(config)