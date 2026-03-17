import sys
import edith_commands

if __name__ == "__main__":
    try:
        print("Testing open chrome")
        print(edith_commands.execute_command("open chrome"))
        print("\nTesting increase volume")
        print(edith_commands.execute_command("increase volume"))
        print("\nTesting lock system")
        # print(edith_commands.execute_command("lock the system"))
    except Exception as e:
        import traceback
        traceback.print_exc()

