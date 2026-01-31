from app import app
from database import db
import models

with app.app_context():
    print("Connecting to database and creating tables...")
    db.create_all()
    print("Tables created successfully!")