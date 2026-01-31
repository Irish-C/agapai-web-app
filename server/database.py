# server/database.py
from prisma import Prisma, register

# Create the single global database instance
db = Prisma()

# This 'register' helper makes it easier to use Prisma's 
# static methods in your models later if needed
register(db)