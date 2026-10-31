import os

from app import app, bcrypt
from models import User, Workout, db


with app.app_context():
    username = os.environ.get("SEED_USERNAME")
    password = os.environ.get("SEED_PASSWORD")
    if not username or not password:
        raise SystemExit("Set SEED_USERNAME and SEED_PASSWORD before running seed.py")

    user = User.query.filter_by(username=username).first()
    if user is None:
        user = User(
            username=username,
            password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
        )
        db.session.add(user)
        db.session.flush()

    if not user.workouts:
        db.session.add(
            Workout(
                exercise="Walk",
                duration=30,
                notes="Sample workout",
                user_id=user.id,
            )
        )
    db.session.commit()
