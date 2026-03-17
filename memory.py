class Memory:
    def __init__(self):
        self.history = []

    def add(self, user, edith):
        self.history.append((user, edith))