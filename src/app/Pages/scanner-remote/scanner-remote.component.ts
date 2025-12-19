import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { ScannerSyncService } from '../../services/scanner-sync.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-scanner-remote',
    standalone: true,
    imports: [CommonModule, ZXingScannerModule],
    templateUrl: './scanner-remote.component.html',
    styleUrl: './scanner-remote.component.css'
})
export class ScannerRemoteComponent implements OnInit, OnDestroy {
    // Scanner state
    scannerEnabled = true;
    availableDevices: MediaDeviceInfo[] = [];
    currentDevice: MediaDeviceInfo | undefined;
    hasDevices = false;
    hasPermission: boolean | null = null;

    // UI state
    lastScannedCode: string | null = null;
    scanCount = 0;
    isConnected = true;

    constructor(
        private scannerSync: ScannerSyncService,
        private router: Router
    ) { }

    ngOnInit(): void {
        console.log('📱 Escáner remoto iniciado');
    }

    ngOnDestroy(): void {
        this.scannerEnabled = false;
    }

    onCamerasFound(devices: MediaDeviceInfo[]): void {
        console.log('📷 Cámaras encontradas:', devices);
        this.availableDevices = devices;
        this.hasDevices = Boolean(devices && devices.length);

        // Seleccionar cámara trasera automáticamente (para móviles)
        const rearCamera = this.availableDevices.find(device =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('trasera') ||
            device.label.toLowerCase().includes('rear')
        );

        if (rearCamera) {
            this.currentDevice = rearCamera;
            console.log('✅ Cámara trasera seleccionada:', this.currentDevice.label);
        } else if (this.availableDevices.length > 0) {
            this.currentDevice = this.availableDevices[0];
            console.log('✅ Cámara por defecto seleccionada:', this.currentDevice.label);
        }
    }

    onPermissionResponse(permission: boolean): void {
        console.log('🔐 Permiso de cámara:', permission);
        this.hasPermission = permission;
    }

    onCodeResult(resultString: string): void {
        if (!resultString) return;

        console.log('🎯 Código escaneado:', resultString);

        // Enviar al POS
        this.scannerSync.sendScan(resultString);

        // Actualizar UI
        this.lastScannedCode = resultString;
        this.scanCount++;

        // Vibrar si está disponible
        if ('vibrate' in navigator) {
            navigator.vibrate(200);
        }

        // Feedback visual temporal
        setTimeout(() => {
            this.lastScannedCode = null;
        }, 2000);
    }

    onScanError(error: any): void {
        console.error('❌ Error del escáner:', error);
    }

    onDeviceSelectChange(deviceId: string): void {
        const device = this.availableDevices.find(x => x.deviceId === deviceId);
        if (device) {
            this.currentDevice = device;
            console.log('🔄 Cámara cambiada a:', device.label);
        }
    }

    goToPOS(): void {
        this.router.navigate(['/cobrar']);
    }

    resetCounter(): void {
        this.scanCount = 0;
    }
}
