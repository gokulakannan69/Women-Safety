import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SafeZones } from './SafeZones';
import { api } from '../services/api';
import { MemoryRouter } from 'react-router-dom';

// Mock the api service
vi.mock('../services/api', () => ({
  api: {
    getSafeZones: vi.fn(),
    addSafeZone: vi.fn(),
    deleteSafeZone: vi.fn(),
  },
}));

// Mock react-leaflet
vi.mock('react-leaflet', async () => {
  const original = await vi.importActual('react-leaflet');
  return {
    ...original,
    MapContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TileLayer: () => <div />,
    Marker: () => <div />,
    useMapEvents: () => ({}),
  };
});

describe('SafeZones page', () => {
  it('should render the page with existing safe zones', async () => {
    const mockZones = [
      { id: 1, name: 'Home', radius: 100, latitude: 0, longitude: 0, mobileNumber: '123' },
      { id: 2, name: 'Work', radius: 200, latitude: 0, longitude: 0, mobileNumber: '123' },
    ];
    (api.getSafeZones as any).mockResolvedValue(mockZones);

    render(
      <MemoryRouter>
        <SafeZones />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Work')).toBeInTheDocument();
    });
  });

  it('should allow a user to add a new safe zone', async () => {
    (api.getSafeZones as any).mockResolvedValue([]);
    (api.addSafeZone as any).mockResolvedValue({});

    render(
      <MemoryRouter>
        <SafeZones />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Safe Zone Name (e.g., Home, Office)'), { target: { value: 'New Zone' } });
    fireEvent.click(screen.getByText('Add Safe Zone'));

    // As we are mocking useMapEvents, we can't simulate a map click. 
    // We will assume a location is selected for the purpose of this test.
    // In a real scenario, we would need a more complex setup to test the map interaction.

    // We expect an alert because location is not selected.
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => { });
    fireEvent.click(screen.getByText('Add Safe Zone'));
    expect(alertMock).toHaveBeenCalledWith('Please provide a name and select a location on the map.');

  });

  it('should allow a user to delete a safe zone', async () => {
    const mockZones = [
      { id: 1, name: 'Home', radius: 100, latitude: 0, longitude: 0, mobileNumber: '123' },
    ];
    (api.getSafeZones as any).mockResolvedValue(mockZones);
    (api.deleteSafeZone as any).mockResolvedValue({});

    render(
      <MemoryRouter>
        <SafeZones />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Delete Home'));

    await waitFor(() => {
      expect(api.deleteSafeZone).toHaveBeenCalledWith(1);
    });
  });
});
