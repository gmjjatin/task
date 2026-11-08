// Starts the Next.js dev server: the UI and the /api routes are served together on one port.
console.log(
  'Please click on the `Copy Preview URL` at the top right corner in order to Copy the preview URL and view your changes. You can also use the preview URL in the console below.'
);

const { spawn } = require('child_process');

const PORT = process.env.PORT || '3000';
const previewUrl = process.env.PREVIEW_URL
  ? /^https?:\/\//.test(process.env.PREVIEW_URL)
    ? process.env.PREVIEW_URL
    : `https://${process.env.PREVIEW_URL}`
  : null;

const nextBin = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, 'dev', '-p', PORT, '-H', '0.0.0.0'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
});

// Next.js prints "Local: http://localhost:3000", which does not open from the IDE. Show the preview URL instead.
function rewrite(line) {
  if (!previewUrl) return line;
  if (line.includes('Local:')) return line.replace(/Local:.*$/, `Preview URL: ${previewUrl}`);
  if (line.includes('Network:')) return '';
  return line;
}

function forward(stream, write) {
  let buffer = '';
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    const lines = (buffer + chunk).split('\n');
    buffer = lines.pop(); // the last element may be an incomplete line
    lines.map(rewrite).forEach((line) => write(line));
  });
  stream.on('end', () => {
    if (buffer) write(rewrite(buffer));
  });
}

forward(child.stdout, (line) => console.log(line));
forward(child.stderr, (line) => console.error(line));

child.on('error', (err) => {
  console.error('Error starting the development server:', err.message);
  process.exit(1);
});

child.on('exit', (code, signal) => process.exit(signal ? 1 : code === null ? 0 : code));

['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => child.kill(signal)));
