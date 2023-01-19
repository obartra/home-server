import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { useJSON } from '@/hooks/useJSON';
import { dateTimeFormatter } from '@/utils/dateTimeFormatter';

type Log = {
  scope: string;
  data: unknown;
  message: string;
  timestamp: number;
};

export function Logs() {
  const [logs] = useJSON<Log[]>('/api/logs', [], { refetchEveryMs: 5000 });

  return (
    <TableContainer component={Paper}>
      <Table stickyHeader size="small" aria-label="logs table">
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Scope</TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[...logs].reverse().map(({ scope, data, timestamp, message }) => (
            <TableRow key={timestamp} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component="th" scope="row">
                {dateTimeFormatter.format(timestamp)}
              </TableCell>
              <TableCell>[{`${scope}`}]</TableCell>
              <TableCell>{`${message}`}</TableCell>
              <TableCell>{data ? JSON.stringify(data) : '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
