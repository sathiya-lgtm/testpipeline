const aiHost = import.meta.env.VITE_AI_API_DOMAIN;

export default async (formData: FormData) => {
    const response = await fetch(`${aiHost}/api/files/process-video/`, {
        method: 'PUT',
        body: formData,
        headers: {
            // Don't set Content-Type, the browser will handle it with boundaries
            // You can add other headers here if needed
        },
    });

    return response;
};
