# Docker Desktop Setup Guide for Clara AI

This guide will help you properly set up Docker Desktop on Windows to run your Clara AI backend.

## 🚀 Step-by-Step Docker Setup

### Step 1: Install Docker Desktop

1. **Download Docker Desktop**
   - Go to [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
   - Click "Download for Windows"
   - Choose the appropriate version (Windows 10/11 64-bit)

2. **Install Docker Desktop**
   - Run the downloaded installer
   - Follow the installation wizard
   - **Important**: When prompted, make sure to check "Use WSL 2 instead of Hyper-V" if you have WSL 2 available
   - Complete the installation

3. **Restart Your Computer**
   - After installation, restart your computer to ensure all components are properly initialized

### Step 2: Start Docker Desktop

1. **Launch Docker Desktop**
   - Open Docker Desktop from the Start Menu
   - You should see the Docker whale icon in your system tray

2. **Wait for Initialization**
   - Docker Desktop will take a few minutes to start up
   - You'll see a progress bar and status messages
   - Wait until you see "Docker Desktop is running" in the Docker Desktop window

3. **Accept Terms (if prompted)**
   - You may be asked to accept Docker's terms of service
   - Click "Accept" to continue

### Step 3: Verify Docker Installation

1. **Open PowerShell or Command Prompt**
   - Press `Win + R`, type `powershell`, and press Enter

2. **Test Docker Commands**
   ```powershell
   # Check Docker version
   docker --version
   
   # Check Docker Compose version
   docker-compose --version
   
   # Test Docker functionality
   docker run hello-world
   ```

3. **Expected Output**
   - `docker --version` should show something like: `Docker version 24.0.7, build afdd53b`
   - `docker-compose --version` should show something like: `Docker Compose version v2.23.3`
   - `docker run hello-world` should show a "Hello from Docker!" message

### Step 4: Configure Docker Settings (Optional but Recommended)

1. **Open Docker Desktop Settings**
   - Right-click the Docker whale icon in system tray
   - Select "Settings"

2. **Adjust Resources (if needed)**
   - Go to "Resources" → "General"
   - Increase memory to at least 4GB (8GB recommended)
   - Increase CPUs to at least 2 (4 recommended)
   - Click "Apply & Restart"

3. **Enable WSL 2 Integration (if using WSL)**
   - Go to "Resources" → "WSL Integration"
   - Enable integration with your WSL 2 distributions
   - Click "Apply & Restart"

## 🔧 Troubleshooting Common Issues

### Issue 1: "Docker Desktop is not running"

**Symptoms:**
- Docker commands return "command not found" or connection errors
- Docker whale icon shows a red X or warning

**Solutions:**
1. **Start Docker Desktop**
   - Open Docker Desktop from Start Menu
   - Wait for it to fully initialize (2-5 minutes)

2. **Check Windows Services**
   - Press `Win + R`, type `services.msc`
   - Look for "Docker Desktop Service"
   - Make sure it's running and set to "Automatic"

3. **Restart Docker Desktop**
   - Right-click Docker whale icon → "Quit Docker Desktop"
   - Wait 30 seconds
   - Start Docker Desktop again

### Issue 2: "Docker Compose is not available"

**Symptoms:**
- `docker-compose --version` fails
- Error messages about docker-compose not being found

**Solutions:**
1. **Update Docker Desktop**
   - Docker Compose is included with Docker Desktop
   - Update to the latest version

2. **Check PATH Environment**
   - Docker Desktop should automatically add Docker to your PATH
   - Restart your terminal/PowerShell after installation

3. **Manual Installation (if needed)**
   ```powershell
   # Install Docker Compose manually
   winget install Docker.DockerCompose
   ```

### Issue 3: "WSL 2 is not available"

**Symptoms:**
- Docker Desktop shows WSL 2 errors
- Performance issues or compatibility problems

**Solutions:**
1. **Enable WSL 2**
   ```powershell
   # Run as Administrator
   dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
   ```

2. **Install WSL 2 Kernel Update**
   - Download from: https://aka.ms/wsl2kernel
   - Install the update

3. **Set WSL 2 as Default**
   ```powershell
   wsl --set-default-version 2
   ```

### Issue 4: "Insufficient Memory"

**Symptoms:**
- Docker containers fail to start
- Out of memory errors

**Solutions:**
1. **Increase Docker Memory**
   - Docker Desktop Settings → Resources → General
   - Increase memory allocation (8GB recommended)

2. **Close Other Applications**
   - Close unnecessary applications to free up RAM

3. **Check Available RAM**
   - Press `Ctrl + Shift + Esc` to open Task Manager
   - Check available memory in Performance tab

## ✅ Verification Checklist

Before proceeding with Clara AI deployment, ensure:

- [ ] Docker Desktop is installed and running
- [ ] Docker whale icon shows green (no warnings)
- [ ] `docker --version` works
- [ ] `docker-compose --version` works
- [ ] `docker run hello-world` works
- [ ] Docker Desktop shows "Docker Desktop is running"

## 🚀 Next Steps

Once Docker is properly set up:

1. **Run the setup script:**
   ```powershell
   .\setup-docker-simple.ps1
   ```

2. **Configure your environment:**
   - Edit the `.env` file with your API keys

3. **Deploy Clara AI:**
   ```powershell
   .\deploy-docker.ps1
   ```

## 📞 Getting Help

If you're still having issues:

1. **Check Docker Desktop Logs**
   - Docker Desktop → Troubleshoot → Logs

2. **Reset Docker Desktop**
   - Docker Desktop → Troubleshoot → Reset to factory defaults

3. **Reinstall Docker Desktop**
   - Uninstall from Control Panel
   - Download and install fresh copy

4. **System Requirements**
   - Windows 10/11 64-bit
   - At least 4GB RAM (8GB recommended)
   - WSL 2 or Hyper-V enabled

## 🎉 Success!

Once Docker is working, you'll be able to run your Clara AI backend locally and save money on hosting costs!
