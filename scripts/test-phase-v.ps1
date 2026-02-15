# Phase V Testing Script for Windows
# Run this script to test all Phase V features

Write-Host "🧪 Phase V Feature Testing Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
$kubectl = Get-Command kubectl -ErrorAction SilentlyContinue
$minikube = Get-Command minikube -ErrorAction SilentlyContinue

if (-not $kubectl) {
    Write-Host "❌ kubectl not found. Please install kubectl first." -ForegroundColor Red
    exit 1
}

if (-not $minikube) {
    Write-Host "⚠️  Minikube not found. Assuming cloud deployment." -ForegroundColor Yellow
}

Write-Host "✅ Prerequisites OK" -ForegroundColor Green
Write-Host ""

# Test 1: Check all pods are running
Write-Host "Test 1: Checking pod status..." -ForegroundColor Yellow
$pods = kubectl get pods -n todo-app -o json | ConvertFrom-Json
$allRunning = $true

foreach ($pod in $pods.items) {
    $name = $pod.metadata.name
    $status = $pod.status.phase
    $ready = ($pod.status.containerStatuses | Where-Object { $_.ready -eq $true }).Count
    $total = $pod.status.containerStatuses.Count

    if ($status -eq "Running" -and $ready -eq $total) {
        Write-Host "  ✅ $name ($ready/$total)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $name ($ready/$total) - $status" -ForegroundColor Red
        $allRunning = $false
    }
}

if ($allRunning) {
    Write-Host "✅ Test 1 PASSED: All pods running" -ForegroundColor Green
} else {
    Write-Host "❌ Test 1 FAILED: Some pods not running" -ForegroundColor Red
}
Write-Host ""

# Test 2: Check Kafka topics
Write-Host "Test 2: Checking Kafka topics..." -ForegroundColor Yellow
$kafkaPod = kubectl get pods -n kafka -l app.kubernetes.io/name=kafka -o jsonpath='{.items[0].metadata.name}'

if ($kafkaPod) {
    $topics = kubectl exec -n kafka $kafkaPod -- bin/kafka-topics.sh --list --bootstrap-server localhost:9092 2>$null

    $requiredTopics = @("tasks.events", "tasks.reminders", "tasks.updates")
    $allTopicsExist = $true

    foreach ($topic in $requiredTopics) {
        if ($topics -match $topic) {
            Write-Host "  ✅ Topic '$topic' exists" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Topic '$topic' missing" -ForegroundColor Red
            $allTopicsExist = $false
        }
    }

    if ($allTopicsExist) {
        Write-Host "✅ Test 2 PASSED: All Kafka topics exist" -ForegroundColor Green
    } else {
        Write-Host "❌ Test 2 FAILED: Some topics missing" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Test 2 FAILED: Kafka pod not found" -ForegroundColor Red
}
Write-Host ""

# Test 3: Check Dapr components
Write-Host "Test 3: Checking Dapr components..." -ForegroundColor Yellow
$components = kubectl get components -n todo-app -o json | ConvertFrom-Json

$requiredComponents = @("kafka-pubsub", "statestore", "kubernetes-secret-store")
$allComponentsExist = $true

foreach ($comp in $requiredComponents) {
    $found = $components.items | Where-Object { $_.metadata.name -eq $comp }
    if ($found) {
        Write-Host "  ✅ Component '$comp' exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Component '$comp' missing" -ForegroundColor Red
        $allComponentsExist = $false
    }
}

if ($allComponentsExist) {
    Write-Host "✅ Test 3 PASSED: All Dapr components exist" -ForegroundColor Green
} else {
    Write-Host "❌ Test 3 FAILED: Some components missing" -ForegroundColor Red
}
Write-Host ""

# Test 4: Check backend health
Write-Host "Test 4: Checking backend health..." -ForegroundColor Yellow
$backendPod = kubectl get pods -n todo-app -l app=todo-backend -o jsonpath='{.items[0].metadata.name}'

if ($backendPod) {
    $health = kubectl exec -n todo-app $backendPod -c backend -- curl -s http://localhost:8000/health 2>$null | ConvertFrom-Json

    if ($health.status -eq "healthy") {
        Write-Host "  ✅ Backend is healthy" -ForegroundColor Green
        if ($health.database -eq "connected") {
            Write-Host "  ✅ Database connected" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Database not connected: $($health.database)" -ForegroundColor Red
        }
        Write-Host "✅ Test 4 PASSED: Backend health check OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Test 4 FAILED: Backend unhealthy" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Test 4 FAILED: Backend pod not found" -ForegroundColor Red
}
Write-Host ""

# Test 5: Check services
Write-Host "Test 5: Checking services..." -ForegroundColor Yellow
$services = kubectl get svc -n todo-app -o json | ConvertFrom-Json

$requiredServices = @("todo-frontend", "todo-backend", "websocket-service")
$allServicesExist = $true

foreach ($svc in $requiredServices) {
    $found = $services.items | Where-Object { $_.metadata.name -eq $svc }
    if ($found) {
        Write-Host "  ✅ Service '$svc' exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Service '$svc' missing" -ForegroundColor Red
        $allServicesExist = $false
    }
}

if ($allServicesExist) {
    Write-Host "✅ Test 5 PASSED: All services exist" -ForegroundColor Green
} else {
    Write-Host "❌ Test 5 FAILED: Some services missing" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Get frontend URL
if ($minikube) {
    $minikubeIp = minikube ip
    $frontendPort = kubectl get svc todo-frontend -n todo-app -o jsonpath='{.spec.ports[0].nodePort}'
    $frontendUrl = "http://${minikubeIp}:${frontendPort}"
    Write-Host "🌐 Frontend URL: $frontendUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To open in browser, run:" -ForegroundColor Yellow
    Write-Host "  Start-Process '$frontendUrl'" -ForegroundColor White
} else {
    $frontendIp = kubectl get svc todo-frontend -n todo-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
    if ($frontendIp) {
        Write-Host "🌐 Frontend URL: http://$frontendIp" -ForegroundColor Cyan
    } else {
        Write-Host "⏳ Frontend LoadBalancer IP pending..." -ForegroundColor Yellow
        Write-Host "   Run: kubectl get svc todo-frontend -n todo-app -w" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open the frontend URL in your browser" -ForegroundColor White
Write-Host "2. Create a task with due date and recurring enabled" -ForegroundColor White
Write-Host "3. Complete the task and verify next occurrence is created" -ForegroundColor White
Write-Host "4. Open multiple browser tabs and verify real-time sync" -ForegroundColor White
Write-Host "5. Wait for reminder and verify notification appears" -ForegroundColor White
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "  kubectl logs -f deployment/todo-backend -n todo-app" -ForegroundColor White
Write-Host "  kubectl logs -f deployment/recurring-task-service -n todo-app" -ForegroundColor White
Write-Host ""
