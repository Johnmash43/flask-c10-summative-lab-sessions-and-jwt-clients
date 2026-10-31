# Workout Tracker API

A Flask API for session-based authentication and private workout tracking. Each workout belongs to its owner and the workout list is paginated.

## Requirements

Python 3.8.13 or newer and Pipenv.

## Installation

```bash
pipenv install --dev
pipenv run flask --app app db upgrade
```

Set a secret key before running the server:

```bash
export SECRET_KEY="replace-with-a-long-random-value"
```

For HTTPS deployments, also set `SESSION_COOKIE_SECURE=1`.

Optional: create a sample account and workout:

```bash
export SEED_USERNAME="demo"
export SEED_PASSWORD="choose-a-password"
pipenv run python seed.py
```

## Run

```bash
pipenv run python app.py
```

The API runs at `http://localhost:5555`. The session frontend in `client-with-sessions` is configured to use that port.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| POST | `/signup` | Create an account and sign in. Requires `username`, `password`, and `password_confirmation`. |
| POST | `/login` | Sign in with `username` and `password`. |
| GET | `/check_session` | Return the signed-in user, or `{}` when signed out. |
| DELETE | `/logout` | Sign out and clear the session. |
| GET | `/workouts?page=1&per_page=10` | List the signed-in user's workouts with pagination. |
| POST | `/workouts` | Create a workout with `exercise`, positive integer `duration` in minutes, and optional `notes`. |
| PATCH | `/workouts/<id>` | Update one or more of `exercise`, `duration`, and `notes`. |
| DELETE | `/workouts/<id>` | Delete one of the signed-in user's workouts. |

Workout endpoints require the session cookie created by signup or login. Records owned by another user are returned as not found.
