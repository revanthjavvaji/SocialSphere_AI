
try:
    with open("d:\\SocialSphereAI\\SocialSphere_AI\\debug.log", "r") as f:
        print(f.read())
except FileNotFoundError:
    print("Log file not found")
