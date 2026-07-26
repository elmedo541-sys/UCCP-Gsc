const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UPLOAD_CONFIG = {
  maxFileSizeMB: 10,
  allowedExtensions: ["jpg","jpeg","png","gif","webp"],
};

interface UploadRequest {
  file_name: string;
  file_size: number;
}

function successResponse(data: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ success: true, ...data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function errorResponse(status: number, message: string, code: string) {
  console.error(`[Upload Error] ${code}: ${message}`);
  return new Response(
    JSON.stringify({ success: false, message, code }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function validateFile(fileName: string, fileSize: number): string | null {
  const maxSizeBytes = UPLOAD_CONFIG.maxFileSizeMB * 1024 * 1024;
  if (fileSize > maxSizeBytes) {
    return `File too large. Maximum allowed: ${UPLOAD_CONFIG.maxFileSizeMB}MB`;
  }
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext || !UPLOAD_CONFIG.allowedExtensions.includes(ext)) {
    return `Unsupported file type. Allowed: ${UPLOAD_CONFIG.allowedExtensions.join(", ")}`;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EDGE_FUNCTION_TOKEN = Deno.env.get("EDGE_FUNCTION_TOKEN_652bedb5e34b");
    if (!EDGE_FUNCTION_TOKEN) {
      return errorResponse(500, "Upload service token not configured", "configuration_error");
    }

    if (req.method === "POST") {
      const body: UploadRequest = await req.json();
      const { file_name, file_size } = body;

      if (!file_name) {
        return errorResponse(400, "Please select a file to upload", "empty_file_name");
      }
      if (!file_size || file_size <= 0) {
        return errorResponse(400, "Invalid file size", "invalid_file_size");
      }

      const validationError = validateFile(file_name, file_size);
      if (validationError) {
        return errorResponse(400, validationError, "validation_error");
      }

      const params = new URLSearchParams({
        file_name,
        file_size: String(file_size),
      });
      console.log(`[Upload] Requesting URL for: ${file_name} (${file_size} bytes)`);

      const response = await fetch(
        `https://api.enter.pro/code/api/v1/edge-function/resource_path?${params}`,
        {
          headers: { Authorization: `Bearer ${EDGE_FUNCTION_TOKEN}` },
        }
      );

      const apiResponse = await response.json() as {
        code?: number;
        message?: string;
        data?: { upload_url?: string; resource_path?: string };
      };

      if (response.ok && apiResponse.code === 0 && apiResponse.data) {
        console.log(`[Upload] Success - path: ${apiResponse.data.resource_path}`);
        return successResponse({
          upload_url: apiResponse.data.upload_url,
          resource_path: apiResponse.data.resource_path,
        });
      }

      console.error(`[Upload] API Error: ${apiResponse.code} - ${apiResponse.message}`);
      return errorResponse(
        response.status,
        apiResponse.message || "Failed to get upload URL",
        "api_error"
      );
    }

    return errorResponse(404, "Not found", "not_found");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal error";
    return errorResponse(500, msg, "internal_error");
  }
});