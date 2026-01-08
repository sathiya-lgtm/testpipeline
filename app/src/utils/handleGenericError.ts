import { toast } from 'react-toastify';

export default (err: any) => {
    const errorMessage = err instanceof Error ? err.message : String(err);

    console.error(errorMessage);
    toast.error(errorMessage);
};
