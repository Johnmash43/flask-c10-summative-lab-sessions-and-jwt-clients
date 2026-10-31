import os
from functools import wraps

from flask import Flask, jsonify, request, session
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate

from models import User, Workout, db

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY") or os.urandom(32)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL", "sqlite:///workouts.db"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("SESSION_COOKIE_SECURE") == "1"

db.init_app(app)
bcrypt = Bcrypt(app)
migrate = Migrate(app, db)


def current_user_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return view(*args, **kwargs)

    return wrapped


def user_json(user):
    return {"id": user.id, "username": user.username}


def workout_json(workout):
    return {
        "id": workout.id,
        "exercise": workout.exercise,
        "duration": workout.duration,
        "notes": workout.notes,
    }


def request_data():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None
    return data


@app.post("/signup")
def signup():
    data = request_data()
    if data is None:
        return jsonify({"errors": ["A JSON request body is required"]}), 400
    username = data.get("username")
    password = data.get("password")
    if not isinstance(username, str) or not username.strip() or len(username) > 80:
        return jsonify({"errors": ["Username must be 1 to 80 characters"]}), 400
    if (
        not isinstance(password, str)
        or len(password) < 8
        or len(password.encode("utf-8")) > 72
    ):
        return jsonify(
            {"errors": ["Password must be at least 8 characters and no more than 72 bytes"]}
        ), 400
    username = username.strip()
    if data.get("password_confirmation") != password:
        return jsonify({"errors": ["Passwords do not match"]}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"errors": ["Username is already taken"]}), 409

    user = User(
        username=username,
        password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
    )
    db.session.add(user)
    db.session.commit()
    session.clear()
    session["user_id"] = user.id
    return jsonify(user_json(user)), 201


@app.post("/login")
def login():
    data = request_data()
    if data is None:
        return jsonify({"errors": ["A JSON request body is required"]}), 400
    username = data.get("username")
    password = data.get("password")
    if not isinstance(username, str) or not isinstance(password, str):
        return jsonify({"errors": ["Username and password are required"]}), 400
    if len(password.encode("utf-8")) > 72:
        return jsonify({"errors": ["Invalid username or password"]}), 401
    username = username.strip()
    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"errors": ["Invalid username or password"]}), 401
    session.clear()
    session["user_id"] = user.id
    return jsonify(user_json(user))


@app.get("/check_session")
def check_session():
    user_id = session.get("user_id")
    user = db.session.get(User, user_id) if user_id else None
    return jsonify(user_json(user) if user else {})


@app.delete("/logout")
def logout():
    session.clear()
    return jsonify({})


@app.route("/workouts", methods=["GET", "POST"])
@current_user_required
def workouts():
    user_id = session["user_id"]
    if request.method == "POST":
        data = request_data()
        if data is None:
            return jsonify({"error": "A JSON request body is required"}), 400
        exercise = data.get("exercise")
        duration = data.get("duration")
        notes = data.get("notes", "")
        if (
            not isinstance(exercise, str)
            or not exercise.strip()
            or len(exercise) > 120
        ):
            return jsonify({"error": "Exercise must be 1 to 120 characters"}), 400
        if (
            not isinstance(duration, int)
            or isinstance(duration, bool)
            or duration < 1
        ):
            return jsonify({"error": "Duration must be a positive number of minutes"}), 400
        if not isinstance(notes, str) or len(notes) > 500:
            return jsonify({"error": "Notes must be 500 characters or fewer"}), 400
        workout = Workout(
            exercise=exercise.strip(),
            duration=duration,
            notes=notes,
            user_id=user_id,
        )
        db.session.add(workout)
        db.session.commit()
        return jsonify(workout_json(workout)), 201

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    if page is None or per_page is None or page < 1 or not 1 <= per_page <= 100:
        return jsonify(
            {"error": "Page must be positive and per_page must be between 1 and 100"}
        ), 400
    pagination = Workout.query.filter_by(user_id=user_id).order_by(Workout.id).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify(
        {
            "workouts": [workout_json(workout) for workout in pagination.items],
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
        }
    )


@app.route("/workouts/<int:workout_id>", methods=["PATCH", "DELETE"])
@current_user_required
def workout_detail(workout_id):
    workout = Workout.query.filter_by(
        id=workout_id, user_id=session["user_id"]
    ).first()
    if not workout:
        return jsonify({"error": "Workout not found"}), 404
    if request.method == "DELETE":
        db.session.delete(workout)
        db.session.commit()
        return "", 204

    data = request_data()
    if data is None or not data:
        return jsonify({"error": "A non-empty JSON request body is required"}), 400
    if set(data) - {"exercise", "duration", "notes"}:
        return jsonify(
            {"error": "Only exercise, duration, and notes can be updated"}
        ), 400
    if "exercise" in data:
        if (
            not isinstance(data["exercise"], str)
            or not data["exercise"].strip()
            or len(data["exercise"]) > 120
        ):
            return jsonify({"error": "Exercise must be 1 to 120 characters"}), 400
        workout.exercise = data["exercise"].strip()
    if "duration" in data:
        if (
            not isinstance(data["duration"], int)
            or isinstance(data["duration"], bool)
            or data["duration"] < 1
        ):
            return jsonify(
                {"error": "Duration must be a positive number of minutes"}
            ), 400
        workout.duration = data["duration"]
    if "notes" in data:
        if not isinstance(data["notes"], str) or len(data["notes"]) > 500:
            return jsonify({"error": "Notes must be 500 characters or fewer"}), 400
        workout.notes = data["notes"]
    db.session.commit()
    return jsonify(workout_json(workout))


if __name__ == "__main__":
    app.run(port=5555)
