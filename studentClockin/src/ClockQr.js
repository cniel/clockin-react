import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { QrReader } from 'react-qr-reader';

const ClockQr = () => {
  const [scanResult, setScanResult] = useState('');
  const [message, setMessage] = useState('');
  const videoRef = useRef(null);

  const handleScan = async (data) => {
    if (data) {
      setScanResult(data);
      try {
        // Fetch event details based on the scanned QR code (location)
        const response = await axios.get('http://localhost:3000/get-event', {
          params: { location: data },
        });

        if (response.data) {
          // Assuming the response contains event details and user info
          const { eventId, userId, promotion, group } = response.data;

          // Send clock-in action
          const clockInResponse = await axios.post('http://localhost:3000/clockin', {
            eventId,
            userId,
            promotion,
            group,
          });

          if (clockInResponse.status === 200) {
            setMessage('Clock-in successful!');
          } else {
            setMessage('Clock-in failed. Please try again.');
          }
        } else {
          setMessage('No event found for this location.');
        }
      } catch (error) {
        console.error('Error fetching event or clocking in:', error);
        setMessage('An error occurred. Please try again.');
      }
    }
  };

  const handleError = (err) => {
    console.error(err);
    setMessage('Error scanning QR code. Please try again.');
  };

  useEffect(() => {
    // Start the QR reader when the component mounts
    const qrReader = new QrReader({
      delay: 300,
      onError: handleError,
      onScan: handleScan,
    });

    qrReader.start(videoRef.current);

    return () => {
      qrReader.stop();
    };
  }, []);

  return (
    <div className="container">
      <h2>Clock In</h2>
      <div style={{ position: 'relative', width: '100%', height: 'auto' }}>
        <video ref={videoRef} style={{ width: '100%', height: 'auto', borderRadius: '10px' }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          borderRadius: '10px',
          fontSize: '20px',
          fontWeight: 'bold',
          pointerEvents: 'none',
        }}>
          {scanResult ? `Scanned QR Code: ${scanResult}` : 'Align QR code within the frame'}
        </div>
      </div>
      {message && <p>{message}</p>}
    </div>
  );
};

export default ClockQr;
