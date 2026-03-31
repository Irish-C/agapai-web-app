import asyncio
from db.db_setup import db

async def main():
    try:
        await db.connect()
        res = await db.query_raw("SELECT 1 as val")
        print('QUERY_RESULT:', res)
    except Exception as e:
        print('ERROR:', e)
    finally:
        if db.is_connected():
            await db.disconnect()

if __name__ == '__main__':
    asyncio.run(main())
