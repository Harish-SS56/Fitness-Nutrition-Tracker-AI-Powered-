#!/usr/bin/env node
/**
 * Instant Email Test Script
 * Tests email sending functionality immediately
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🧪 INSTANT EMAIL TEST SCRIPT')
console.log('=' .repeat(50))

// Test configurations
const TEST_CONFIGS = [
  {
    name: 'Database Connection Test',
    command: 'python',
    args: ['email_service.py', 'test_db'],
    cwd: join(__dirname, 'python_email_service')
  },
  {
    name: 'SMTP Connection Test', 
    command: 'python',
    args: ['email_service.py', 'test'],
    cwd: join(__dirname, 'python_email_service')
  },
  {
    name: 'Send Test Email to Harini',
    command: 'python',
    args: ['email_service.py', 'send_reminder', 'hk6113367@gmail.com', 'Harini', '1358', '180'],
    cwd: join(__dirname, 'python_email_service')
  },
  {
    name: 'Send Test Email to Harish',
    command: 'python',
    args: ['email_service.py', 'send_reminder', 'harishdeepikassdeepikass@gmail.com', 'Harish', '2356', '180'],
    cwd: join(__dirname, 'python_email_service')
  },
  {
    name: 'Send Achievement Test Email',
    command: 'python',
    args: ['email_service.py', 'send_achievement', 'hk6113367@gmail.com', 'Harini', 'Daily Calorie Goal', 'You met your daily calorie goal!'],
    cwd: join(__dirname, 'python_email_service')
  }
]

async function runTest(config) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Running: ${config.name}`)
    console.log(`📁 Directory: ${config.cwd}`)
    console.log(`⚡ Command: ${config.command} ${config.args.join(' ')}`)
    console.log('-'.repeat(40))
    
    const process = spawn(config.command, config.args, {
      cwd: config.cwd,
      stdio: 'pipe',
      shell: true
    })
    
    let output = ''
    let errorOutput = ''
    
    process.stdout.on('data', (data) => {
      const text = data.toString()
      output += text
      console.log(text.trim())
    })
    
    process.stderr.on('data', (data) => {
      const text = data.toString()
      errorOutput += text
      console.error(`❌ ${text.trim()}`)
    })
    
    process.on('close', (code) => {
      console.log(`\n📊 Exit Code: ${code}`)
      if (code === 0) {
        console.log('✅ SUCCESS')
      } else {
        console.log('❌ FAILED')
      }
      console.log('='.repeat(50))
      
      resolve({
        name: config.name,
        success: code === 0,
        output,
        errorOutput,
        exitCode: code
      })
    })
    
    process.on('error', (error) => {
      console.error(`❌ Process Error: ${error.message}`)
      resolve({
        name: config.name,
        success: false,
        output,
        errorOutput: error.message,
        exitCode: -1
      })
    })
  })
}

async function runAllTests() {
  console.log(`📧 Email Configuration:`)
  console.log(`   📮 From: harishdeepikassdeepikass@gmail.com`)
  console.log(`   🔑 Password: vqsv erqr tstj mvdt`)
  console.log(`   🎯 Test Recipients: hk6113367@gmail.com, harishdeepikassdeepikass@gmail.com`)
  console.log('='.repeat(50))
  
  const results = []
  
  for (const config of TEST_CONFIGS) {
    const result = await runTest(config)
    results.push(result)
    
    // Wait 2 seconds between tests to avoid rate limiting
    if (config !== TEST_CONFIGS[TEST_CONFIGS.length - 1]) {
      console.log('\n⏳ Waiting 2 seconds before next test...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  // Summary
  console.log('\n📋 TEST SUMMARY')
  console.log('='.repeat(50))
  
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${result.name}`)
  })
  
  console.log(`\n📊 Results: ${successful} passed, ${failed} failed`)
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:')
    results.filter(r => !r.success).forEach(result => {
      console.log(`   • ${result.name}: ${result.errorOutput || 'Unknown error'}`)
    })
  }
  
  if (successful === results.length) {
    console.log('\n🎉 ALL TESTS PASSED! Email system is working perfectly!')
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.')
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error)
  process.exit(1)
})
