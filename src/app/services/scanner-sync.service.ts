import { Injectable } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';

interface ScanEvent {
    code: string;
    timestamp: number;
    deviceId: string;
}

@Injectable({
    providedIn: 'root'
})
export class ScannerSyncService {
    private readonly STORAGE_KEY = 'fullcontrol_scanner_sync';
    private readonly DEVICE_ID = this.generateDeviceId();

    // Observable para códigos escaneados
    public scannedCode$ = new BehaviorSubject<string | null>(null);

    private lastProcessedTimestamp = 0;

    constructor() {
        // Escuchar cambios en localStorage cada 500ms
        interval(500).subscribe(() => {
            this.checkForNewScans();
        });
    }

    /**
     * Enviar código escaneado (llamar desde el celular)
     */
    sendScan(code: string): void {
        const scanEvent: ScanEvent = {
            code,
            timestamp: Date.now(),
            deviceId: this.DEVICE_ID
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scanEvent));
        console.log('📱 Código enviado:', code);
    }

    /**
     * Verificar si hay nuevos escaneos (llamar desde el POS)
     */
    private checkForNewScans(): void {
        const stored = localStorage.getItem(this.STORAGE_KEY);

        if (!stored) return;

        try {
            const scanEvent: ScanEvent = JSON.parse(stored);

            // Ignorar si es del mismo dispositivo o ya procesado
            if (scanEvent.deviceId === this.DEVICE_ID) return;
            if (scanEvent.timestamp <= this.lastProcessedTimestamp) return;

            // Ignorar si es muy antiguo (más de 10 segundos)
            if (Date.now() - scanEvent.timestamp > 10000) return;

            // Nuevo código detectado
            this.lastProcessedTimestamp = scanEvent.timestamp;
            this.scannedCode$.next(scanEvent.code);

            console.log('💻 POS recibió código:', scanEvent.code);

        } catch (error) {
            console.error('Error al procesar scan:', error);
        }
    }

    /**
     * Limpiar datos de sincronización
     */
    clearSync(): void {
        localStorage.removeItem(this.STORAGE_KEY);
        this.lastProcessedTimestamp = 0;
    }

    /**
     * Generar ID único para este dispositivo
     */
    private generateDeviceId(): string {
        let deviceId = localStorage.getItem('fullcontrol_device_id');

        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('fullcontrol_device_id', deviceId);
        }

        return deviceId;
    }
}
