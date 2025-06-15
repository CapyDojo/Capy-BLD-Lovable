
# Basic Git Commands Guide

This guide covers the essential Git commands for your day-to-day workflow when working with a GitHub repository locally.

---

## 1. Getting Started: Cloning the Repository

To get a copy of a project from GitHub onto your computer, you use `git clone`. You only need to do this once per project.

- **How to use it:** Navigate to your desired folder in your terminal (e.g., `cd Documents/Projects`) and then run the clone command with the repository URL.

```bash
git clone <repository_url>
```

**Example:**
```bash
git clone https://github.com/your-username/your-project.git
```
This creates a new folder with the project's code inside your current directory.

---

## 2. The Core Workflow: Syncing & Saving

This is the cycle you'll follow most often.

### Step A: Get the Latest Changes (`git pull`)

**Always do this before you start working.** This command fetches the latest version of the project from GitHub and merges it into your local copy. This helps prevent conflicts.

```bash
git pull
```

### Step B: Make Your Changes

Now, you can open the project in your code editor and make any changes you want.

### Step C: Check Your Status (`git status`)

This is your most-used command. It shows you which files you've changed, which are new, and which are ready to be saved.

```bash
git status
```

### Step D: Stage Your Changes (`git add`)

After you've modified files, you need to tell Git which changes you want to include in your next save point (commit).

```bash
# To stage a specific file:
git add <file_name>

# To stage ALL modified files (most common):
git add .
```

### Step E: Save Your Changes (`git commit`)

A "commit" is like a labeled snapshot of your work. Always write a clear, concise message describing what you did.

```bash
git commit -m "Your descriptive message goes here"
```
**Example:**
```bash
git commit -m "Feat: Add user login functionality"
```

### Step F: Send Your Changes to GitHub (`git push`)

Once you've committed your changes locally, this command uploads them to the remote repository on GitHub for everyone else to see.

```bash
git push
```

---

## Summary: The Daily Loop

Your most common workflow will look like this:

1.  `git pull` (Start of the day to get latest updates)
2.  *(...do your coding...)*
3.  `git status` (Check what you've changed)
4.  `git add .` (Stage all your changes)
5.  `git commit -m "A clear message about the changes"` (Save your work)
6.  `git push` (Upload your saved work to GitHub)
7.  Repeat!
