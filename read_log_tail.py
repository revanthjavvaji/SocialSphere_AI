
try:
    with open("d:\\SocialSphereAI\\SocialSphere_AI\\debug.log", "r") as f:
        lines = f.readlines()
        for line in lines[-20:]:
            print(line.strip())
except FileNotFoundError:
    print("Log file not found")
