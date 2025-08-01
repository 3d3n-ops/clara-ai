#!/usr/bin/env node

// Claude Doctor - Comprehensive diagnostic tool for Clara AI
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class ClaudeDoctor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.success = [];
    this.projectRoot = process.cwd();
  }

  log(emoji, message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${emoji} [${timestamp}] ${message}`);
    
    switch(type) {
      case 'error':
        this.issues.push(message);
        break;
      case 'warning':
        this.warnings.push(message);
        break;
      case 'success':
        this.success.push(message);
        break;
    }
  }

  async checkFileExists(filePath, description) {
    const fullPath = path.join(this.projectRoot, filePath);
    if (fs.existsSync(fullPath)) {
      this.log('✅', `${description} exists: ${filePath}`, 'success');
      return true;
    } else {
      this.log('❌', `${description} missing: ${filePath}`, 'error');
      return false;
    }
  }

  async checkEnvironmentVariables() {
    this.log('🔍', 'Checking environment variables...');
    
    const envPath = path.join(this.projectRoot, '.env');
    if (!fs.existsSync(envPath)) {
      this.log('❌', 'Environment file .env not found', 'error');
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = [
      'LIVEKIT_URL',
      'LIVEKIT_API_KEY', 
      'LIVEKIT_API_SECRET',
      'OPENAI_API_KEY',
      'DEEPGRAM_API_KEY',
      'CARTESIA_API_KEY',
      'MODAL_WEBHOOK_URL'
    ];

    const optionalVars = [
      'NEXT_PUBLIC_LIVEKIT_URL',
      'GOOGLE_AI_API_KEY',
      'PINECONE_API_KEY'
    ];

    requiredVars.forEach(varName => {
      if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=\n`)) {
        this.log('✅', `Required environment variable: ${varName}`, 'success');
      } else {
        this.log('❌', `Missing required environment variable: ${varName}`, 'error');
      }
    });

    optionalVars.forEach(varName => {
      if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=\n`)) {
        this.log('✅', `Optional environment variable: ${varName}`, 'success');
      } else {
        this.log('⚠️', `Optional environment variable not set: ${varName}`, 'warning');
      }
    });
  }

  async checkPackageJson() {
    this.log('📦', 'Checking package.json dependencies...');
    
    const packagePath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packagePath)) {
      this.log('❌', 'package.json not found', 'error');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const requiredDeps = [
      '@livekit/components-react',
      'livekit-client',
      'livekit-server-sdk',
      'next',
      'react'
    ];

    requiredDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        this.log('✅', `Dependency installed: ${dep}@${packageJson.dependencies[dep]}`, 'success');
      } else {
        this.log('❌', `Missing required dependency: ${dep}`, 'error');
      }
    });
  }

  async checkModalDeployment() {
    this.log('🚀', 'Checking Modal deployment status...');
    
    try {
      const { stdout } = await execAsync('modal app list');
      if (stdout.includes('clara-voice-agent')) {
        this.log('✅', 'Modal app "clara-voice-agent" is deployed', 'success');
        
        // Check if it's running
        if (stdout.includes('deployed')) {
          this.log('✅', 'Modal app is in deployed state', 'success');
        } else {
          this.log('⚠️', 'Modal app exists but may not be deployed', 'warning');
        }
      } else {
        this.log('❌', 'Modal app "clara-voice-agent" not found', 'error');
      }
    } catch (error) {
      this.log('❌', `Modal CLI error: ${error.message}`, 'error');
    }
  }

  async checkModalSecrets() {
    this.log('🔐', 'Checking Modal secrets...');
    
    try {
      const { stdout } = await execAsync('modal secret list');
      if (stdout.includes('clara-voice-agent-secrets')) {
        this.log('✅', 'Modal secrets configured', 'success');
      } else {
        this.log('❌', 'Modal secrets "clara-voice-agent-secrets" not found', 'error');
      }
    } catch (error) {
      this.log('❌', `Modal secrets check failed: ${error.message}`, 'error');
    }
  }

  async testModalWebhook() {
    this.log('🌐', 'Testing Modal webhook endpoint...');
    
    const envPath = path.join(this.projectRoot, '.env');
    if (!fs.existsSync(envPath)) {
      this.log('❌', 'Cannot test webhook: .env file missing', 'error');
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const webhookMatch = envContent.match(/MODAL_WEBHOOK_URL=(.+)/);
    
    if (!webhookMatch) {
      this.log('❌', 'Modal webhook URL not configured', 'error');
      return;
    }

    const webhookUrl = webhookMatch[1].trim();
    if (webhookUrl.includes('[your-app-id]')) {
      this.log('❌', 'Modal webhook URL contains placeholder - update with actual URL', 'error');
      return;
    }

    try {
      const fetch = require('node-fetch');
      const testPayload = {
        event: 'room_started',
        room: { sid: 'test-room', name: 'study-session-test' }
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
        timeout: 10000
      });

      if (response.ok) {
        this.log('✅', `Modal webhook responding: ${response.status}`, 'success');
      } else {
        this.log('⚠️', `Modal webhook returned: ${response.status}`, 'warning');
      }
    } catch (error) {
      this.log('❌', `Modal webhook test failed: ${error.message}`, 'error');
    }
  }

  async checkLiveKitConnection() {
    this.log('🎤', 'Checking LiveKit configuration...');
    
    const envPath = path.join(this.projectRoot, '.env');
    if (!fs.existsSync(envPath)) {
      this.log('❌', 'Cannot check LiveKit: .env file missing', 'error');
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const livekitUrl = envContent.match(/LIVEKIT_URL=(.+)/)?.[1]?.trim();
    const apiKey = envContent.match(/LIVEKIT_API_KEY=(.+)/)?.[1]?.trim();
    
    if (!livekitUrl || !apiKey) {
      this.log('❌', 'LiveKit credentials not configured', 'error');
      return;
    }

    if (livekitUrl.includes('livekit.cloud')) {
      this.log('✅', 'Using LiveKit Cloud instance', 'success');
    } else {
      this.log('ℹ️', `Using custom LiveKit instance: ${livekitUrl}`);
    }

    // Test basic connectivity (simplified)
    if (livekitUrl.startsWith('wss://')) {
      this.log('✅', 'LiveKit URL format is correct', 'success');
    } else {
      this.log('❌', 'LiveKit URL should start with wss://', 'error');
    }
  }

  async checkProjectStructure() {
    this.log('📁', 'Checking project structure...');
    
    const requiredFiles = [
      'package.json',
      '.env',
      'components/voice-assistant-room.tsx',
      'app/api/livekit/token/route.ts',
      'backend/modal_app.py',
      'lib/modal-config.ts'
    ];

    for (const file of requiredFiles) {
      await this.checkFileExists(file, `Required file`);
    }

    const importantDirs = [
      'components',
      'app',
      'backend',
      'lib'
    ];

    importantDirs.forEach(dir => {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        this.log('✅', `Directory exists: ${dir}`, 'success');
      } else {
        this.log('⚠️', `Directory missing: ${dir}`, 'warning');
      }
    });
  }

  async checkNodeModules() {
    this.log('📚', 'Checking node_modules...');
    
    const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      this.log('✅', 'node_modules directory exists', 'success');
      
      // Check if it's properly populated
      const stats = fs.statSync(nodeModulesPath);
      if (stats.isDirectory()) {
        const contents = fs.readdirSync(nodeModulesPath);
        if (contents.length > 10) {
          this.log('✅', `node_modules has ${contents.length} packages`, 'success');
        } else {
          this.log('⚠️', 'node_modules seems sparse - run npm install', 'warning');
        }
      }
    } else {
      this.log('❌', 'node_modules missing - run npm install', 'error');
    }
  }

  async checkGitStatus() {
    this.log('📝', 'Checking git status...');
    
    try {
      const { stdout } = await execAsync('git status --porcelain');
      const modifiedFiles = stdout.trim().split('\n').filter(line => line.trim());
      
      if (modifiedFiles.length === 0) {
        this.log('✅', 'Working directory is clean', 'success');
      } else {
        this.log('ℹ️', `${modifiedFiles.length} modified files in working directory`);
        modifiedFiles.slice(0, 5).forEach(file => {
          this.log('📄', `  ${file}`);
        });
        if (modifiedFiles.length > 5) {
          this.log('📄', `  ... and ${modifiedFiles.length - 5} more files`);
        }
      }
    } catch (error) {
      this.log('⚠️', 'Not a git repository or git not available', 'warning');
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🏥 CLAUDE DOCTOR SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n✅ SUCCESS (${this.success.length}):`);
    this.success.forEach(item => console.log(`   • ${item}`));
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach(item => console.log(`   • ${item}`));
    }
    
    if (this.issues.length > 0) {
      console.log(`\n❌ ISSUES (${this.issues.length}):`);
      this.issues.forEach(item => console.log(`   • ${item}`));
    }

    console.log('\n' + '='.repeat(60));
    
    if (this.issues.length === 0) {
      console.log('🎉 All critical checks passed! Your Clara AI setup looks healthy.');
    } else if (this.issues.length <= 2) {
      console.log('⚠️  Minor issues detected. Please address them for optimal performance.');
    } else {
      console.log('🚨 Multiple issues detected. Please review and fix before proceeding.');
    }
    
    console.log('\n📚 For troubleshooting help, see: MODAL_PRODUCTION_SETUP.md');
    console.log('='.repeat(60));
  }

  async runDiagnostics() {
    console.log('🏥 CLAUDE DOCTOR - Clara AI Diagnostic Tool');
    console.log('='.repeat(60));
    console.log(`📍 Project: ${this.projectRoot}`);
    console.log(`⏰ Started: ${new Date().toLocaleString()}\n`);

    await this.checkProjectStructure();
    await this.checkPackageJson();
    await this.checkNodeModules();
    await this.checkEnvironmentVariables();
    await this.checkModalDeployment();
    await this.checkModalSecrets();
    await this.testModalWebhook();
    await this.checkLiveKitConnection();
    await this.checkGitStatus();

    this.printSummary();
  }
}

// Run diagnostics
const doctor = new ClaudeDoctor();
doctor.runDiagnostics().catch(error => {
  console.error('🚨 Doctor encountered an error:', error.message);
  process.exit(1);
});