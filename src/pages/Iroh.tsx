import Meta from '@/components/Meta';

export default function Iroh() {
  return (
    <>
      <Meta title="Iroh" />
      <iframe
        src="/ProtocolforRelaxation.pdf"
        style={{ width: '100%', height: 'calc(100vh - 64px)', border: 0, marginTop: 0 }}
      />
    </>
  );
}
