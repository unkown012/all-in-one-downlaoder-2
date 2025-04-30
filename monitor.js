const pm2 = require('pm2');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Create monitoring directory
const monitorDir = path.join(__dirname, 'logs', 'monitoring');
if (!fs.existsSync(monitorDir)) {
    fs.mkdirSync(monitorDir, { recursive: true });
}

// Function to get system metrics
function getSystemMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = (usedMem / totalMem) * 100;

    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    return {
        timestamp: new Date().toISOString(),
        memory: {
            total: totalMem,
            free: freeMem,
            used: usedMem,
            usage: memoryUsage
        },
        cpu: {
            cores: cpus.length,
            usage: cpuUsage
        },
        uptime: os.uptime()
    };
}

// Function to monitor PM2 processes
function monitorPM2() {
    pm2.connect((err) => {
        if (err) {
            console.error('Error connecting to PM2:', err);
            return;
        }

        pm2.list((err, list) => {
            if (err) {
                console.error('Error getting PM2 list:', err);
                return;
            }

            const metrics = {
                timestamp: new Date().toISOString(),
                processes: list.map(proc => ({
                    name: proc.name,
                    pid: proc.pid,
                    memory: proc.monit.memory,
                    cpu: proc.monit.cpu,
                    uptime: proc.pm2_env.pm_uptime
                }))
            };

            // Save metrics to file
            const metricsFile = path.join(monitorDir, `metrics-${new Date().toISOString().split('T')[0]}.json`);
            fs.appendFileSync(metricsFile, JSON.stringify(metrics) + '\n');
        });
    });
}

// Function to monitor Redis
function monitorRedis() {
    const Redis = require('ioredis');
    const redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    });

    redis.info().then(info => {
        const metrics = {
            timestamp: new Date().toISOString(),
            redis: {
                connected_clients: info.connected_clients,
                used_memory: info.used_memory,
                total_connections_received: info.total_connections_received,
                total_commands_processed: info.total_commands_processed
            }
        };

        // Save metrics to file
        const metricsFile = path.join(monitorDir, `redis-${new Date().toISOString().split('T')[0]}.json`);
        fs.appendFileSync(metricsFile, JSON.stringify(metrics) + '\n');
    }).catch(err => {
        console.error('Error monitoring Redis:', err);
    });
}

// Function to monitor file system
function monitorFileSystem() {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const stats = fs.statSync(uploadsDir);
    const metrics = {
        timestamp: new Date().toISOString(),
        filesystem: {
            total: stats.size,
            files: fs.readdirSync(uploadsDir).length
        }
    };

    // Save metrics to file
    const metricsFile = path.join(monitorDir, `filesystem-${new Date().toISOString().split('T')[0]}.json`);
    fs.appendFileSync(metricsFile, JSON.stringify(metrics) + '\n');
}

// Function to clean old log files
function cleanOldLogs() {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const files = fs.readdirSync(monitorDir);
    
    files.forEach(file => {
        const filePath = path.join(monitorDir, file);
        const stats = fs.statSync(filePath);
        if (Date.now() - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath);
        }
    });
}

// Start monitoring
function startMonitoring() {
    // Monitor every 5 minutes
    setInterval(() => {
        const systemMetrics = getSystemMetrics();
        const metricsFile = path.join(monitorDir, `system-${new Date().toISOString().split('T')[0]}.json`);
        fs.appendFileSync(metricsFile, JSON.stringify(systemMetrics) + '\n');

        monitorPM2();
        monitorRedis();
        monitorFileSystem();
    }, 5 * 60 * 1000);

    // Clean old logs daily
    setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);
}

// Start monitoring
startMonitoring(); 