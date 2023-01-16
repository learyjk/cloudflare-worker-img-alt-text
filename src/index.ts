/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  MS_API_KEY: string;
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
}

interface Caption {
  text: string;
  confidence: number;
}

interface CaptionData {
  description: {
    tags: string[];
    captions: Caption[];
  };
  requestId: string;
  metadata: {
    height: number;
    width: number;
    format: string;
  };
  modelVersion: string;
}

type RequestBody = {
  url: string;
};

const getCaptionDataforURL = (imgUrlObject: RequestBody, KEY: string) => {
  const captionUrl =
    "https://alt-text.cognitiveservices.azure.com/vision/v3.2/describe?maxCandidates=3";
  const captionData = fetch(captionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-KEY": KEY,
    },
    body: JSON.stringify(imgUrlObject),
  })
    .then((response) => response.json())
    .then((data) => {
      return data as CaptionData;
    });
  return captionData;
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const headers = {
      "content-type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS, POST",
      "Access-Control-Max-Age": "86400",
    };

    try {
      let body: RequestBody = await request.json();
      if (!body) {
        return new Response("Error: No Image URL received!");
      }
      const caption = await getCaptionDataforURL(body, env.MS_API_KEY);
      console.log({ caption });

      const json = JSON.stringify(caption, null, 2);
      const response = new Response(json, {
        headers,
      });
      return response;
    } catch (err) {
      const errorObj = { error: "Error getting image alt text" };
      const response = new Response(JSON.stringify(errorObj), {
        headers,
      });
      return response;
    } finally {
    }
  },
};
