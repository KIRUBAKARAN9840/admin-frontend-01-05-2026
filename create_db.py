import pymysql

# Connection details from .env
DB_HOST = "127.0.0.1"
DB_USER = "root"
DB_PASS = "1234"

try:
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS
    )
    with connection.cursor() as cursor:
        print("Checking/Creating nutrition database...")
        cursor.execute("CREATE DATABASE IF NOT EXISTS nutrition")
        
        print("Creating table nutrition_consultation_form in nutrition database...")
        sql = """
        CREATE TABLE IF NOT EXISTS nutrition.nutrition_consultation_form (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nutritionist_id INT NOT NULL,
            client_id INT NOT NULL,
            full_name VARCHAR(255),
            age VARCHAR(50),
            gender VARCHAR(50),
            occupation VARCHAR(255),
            main_health_goal TEXT,
            anthropometric_table JSON,
            recent_changes JSON,
            fat_distribution JSON,
            nutritionist_notes TEXT,
            vitamin_deficiencies TEXT,
            biochemical_issues TEXT,
            ongoing_medications TEXT,
            clinical_concerns JSON,
            edema_swelling TEXT,
            joint_pain TEXT,
            weakness_dizziness TEXT,
            other_symptoms TEXT,
            meals_daily VARCHAR(100),
            skip_breakfast VARCHAR(100),
            dinner_timing VARCHAR(100),
            late_night_eating VARCHAR(100),
            diet_preference VARCHAR(100),
            water_intake VARCHAR(100),
            eat_outside_frequency VARCHAR(100),
            food_allergies TEXT,
            cooking_time VARCHAR(100),
            stay_arrangement VARCHAR(100),
            eating_pattern_desc TEXT,
            daily_routine JSON,
            lifestyle_habits JSON,
            exercise_routine TEXT,
            step_count VARCHAR(100),
            activity_level VARCHAR(100),
            work_mode VARCHAR(100),
            main_goals TEXT,
            consistency_challenges TEXT,
            expected_support TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX (client_id)
        );
        """
        cursor.execute(sql)
        connection.commit()
    print("Database and table creation completed successfully.")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'connection' in locals():
        connection.close()
