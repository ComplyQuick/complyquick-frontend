import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface CertificateProps {
  courseName: string;
  completionDate: string;
  score: number;
  userName?: string;
}

const Certificate: React.FC<CertificateProps> = ({ courseName, completionDate, score, userName }) => {
  const certificateRef = React.useRef<HTMLDivElement>(null);

  const downloadCertificate = async () => {
    if (certificateRef.current) {
      try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(certificateRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: true,
          useCORS: true,
        });

        const link = document.createElement('a');
        link.download = `${courseName.replace(/\s+/g, '-')}-Certificate.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error('Error generating certificate:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div
        ref={certificateRef}
        className="relative w-[800px] h-[600px] mx-auto bg-white p-12"
        style={{
          background: '#ffffff',
        }}
      >
        {/* Corner Borders */}
        <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-gray-800"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-gray-800"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-gray-800"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-gray-800"></div>

        {/* Inner Border */}
        <div className="absolute inset-8 border-2 border-gray-800"></div>

        {/* Company Logo */}
        <div className="absolute top-8 right-12">
          <span className="text-xl font-bold text-gray-800">ComplyQuick</span>
        </div>

        {/* Certificate Content */}
        <div className="flex flex-col h-full justify-between relative z-10 px-16 py-8">
          <div className="space-y-6 text-left">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">CERTIFICATE</h1>
              <h2 className="text-2xl text-gray-800">OF COMPLETION</h2>
            </div>

            <div className="space-y-8">
              <div>
                <p className="text-xl text-gray-600">Presented to:</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {userName || 'Student Name'}
          </p>
              </div>
          
          <p className="text-xl text-gray-600">
                For successfully completing a compliance course on<br />
                <span className="font-semibold text-gray-800">"{courseName}"</span>
              </p>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <div className="w-48 h-px bg-gray-800"></div>
              <div>
                <p className="font-bold text-gray-800">TARA BOWEN</p>
                <p className="text-gray-600">Project Manager</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="w-48 h-px bg-gray-800"></div>
              <div>
                <p className="font-bold text-gray-800">KAREN BELL</p>
                <p className="text-gray-600">Company Director</p>
              </div>
            </div>
          </div>

          {/* Gold Seal */}
          <div className="absolute top-1/3 right-12 transform -translate-y-1/2">
            <div className="w-32 h-32 relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-sm mb-1">COMPLETION</div>
                  <div className="text-2xl font-bold">2025</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <Button
          onClick={downloadCertificate}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Certificate
        </Button>
      </div>
    </div>
  );
};

export default Certificate; 