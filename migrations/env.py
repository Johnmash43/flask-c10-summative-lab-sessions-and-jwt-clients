from logging.config import fileConfig

from alembic import context
from flask import current_app

config = context.config
fileConfig(config.config_file_name)
database = current_app.extensions["migrate"].db
config.set_main_option(
    "sqlalchemy.url",
    str(database.get_engine().url).replace("%", "%%"),
)


def run_migrations_offline():
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=database.metadata,
        literal_binds=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    with database.get_engine().connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=database.metadata,
            **current_app.extensions["migrate"].configure_args,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
