import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(() => ({
  pulse: {
    animation: `$pulse 2s ease-in-out`,
    'animation-iteration-count': 'infinite',
  },
  '@keyframes pulse': {
    '0%': {
      opacity: 0,
    },
    '50%': {
      opacity: 1,
    },
    '100%': {
      opacity: 0,
    },
  },
}));
