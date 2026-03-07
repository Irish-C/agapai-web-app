import os
from dotenv import load_dotenv
from prisma import Prisma, register

# 1. Load the environment variables from .env
# This must happen before Prisma() is instantiated
load_dotenv() 

# 2. Create the single global database instance
db = Prisma()

# 3. Register the instance
# This allows you to use Prisma's static methods and internal helpers
register(db)