import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dashboard } from './Dashboard';
import { api } from '../services/api';
import { MemoryRouter } from 'react-router-dom';

// Mock the api service
vi.mock('../services/api');

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};
Object.defineProperty(window, 'navigator', {
    value: {
        geolocation: mockGeolocation,
    },
    writable: true
});

// Mock fetch for Overpass API
global.fetch = vi.fn();


describe('Dashboard page', () => {

    beforeEach(() => {
        // Reset mocks before each test
        vi.resetAllMocks();

        // Default mock implementations
        (api.getUser as any).mockResolvedValue({ emergencyContact: '999' });
        (api.getSafeZones as any).mockResolvedValue([]);
        (api.sendSOS as any).mockResolvedValue({ success: true });

        (fetch as any).mockResolvedValue({
            json: () => Promise.resolve({ elements: [] }),
        });

        mockGeolocation.getCurrentPosition.mockImplementation((success) =>
            Promise.resolve(
                success({
                    coords: {
                        latitude: 51.5074,
                        longitude: -0.1278,
                        accuracy: 10,
                        altitude: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null,
                    },
                    timestamp: Date.now(),
                }),
            ),
        );
    });

  it('should find and display the nearest police station on SOS activation', async () => {
    const mockPoliceStation = {
        elements: [
            {
                tags: {
                    name: 'Metropolitan Police',
                    phone: '101',
                    'addr:street': 'Victoria Embankment',
                    'addr:city': 'London',
                },
            },
        ],
    };
    (fetch as any).mockResolvedValue({
        json: () => Promise.resolve(mockPoliceStation),
    });

    render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    );

    // Find the test SOS button and click it
    const sosButton = screen.getByText('Test SOS (Bypass Voice)');
    fireEvent.click(sosButton);

    await waitFor(() => {
      expect(screen.getByText('Nearest Police Station')).toBeInTheDocument();
      expect(screen.getByText('Metropolitan Police')).toBeInTheDocument();
      expect(screen.getByText(/Call Now/)).toBeInTheDocument();
    });
  });

});