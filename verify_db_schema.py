from sqlalchemy import create_engine, inspect
from models import Base

SQLALCHEMY_DATABASE_URL = "sqlite:///./social_sphere_new.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

inspector = inspect(engine)
columns = [c['name'] for c in inspector.get_columns('connectors')]

print("Columns in connectors table:")
print(columns)

if 'x_api_key' in columns and 'linkedin_access_token' not in columns:
    print("SUCCESS: Schema updated (X present, LinkedIn absent/ignored).")
elif 'x_api_key' in columns:
    print("SUCCESS: X columns present.")
else:
    print("FAILURE: X columns missing.")
