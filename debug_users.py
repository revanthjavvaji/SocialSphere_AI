from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import UserCredentials

# Use the NEW database file
SQLALCHEMY_DATABASE_URL = "sqlite:///./social_sphere_new.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()
users = db.query(UserCredentials).all()

print(f"Total users found: {len(users)}")
for user in users:
    print(f"ID: {user.bid}, Email: {user.email}, Bid: {user.bid}")

db.close()
