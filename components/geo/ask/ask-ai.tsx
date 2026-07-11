"use client";

import { useEffect, useState } from "react";
import { usePrivy, useLogin } from "@privy-io/react-auth";

import { AlertBanner } from "@/components/shared/alert-banner";
import { GeoPaywall } from "@/components/geo/geo-paywall";
import { useEndpointRunner } from "@/hooks/use-endpoint-runner";
import { useLlmModels } from "@/hooks/use-llm-models";
import { useManifestPrices } from "@/hooks/use-manifest-prices";
import { AskForm } from "./ask-form";
import { AskResponse } from "./ask-response";
import { AskSkeleton } from "./ask-skeleton";
import { AskEmpty } from "./ask-empty";
import { engineById, type EngineId } from "./engines";

/**
 * Ask-the-AI screen: run one live LLM response through the shared endpoint
 * runner, which handles the x402 402 -> pay -> retry loop itself.
 */
export function AskAi() {
  const [prompt, setPrompt] = useState("");
  const [engineId, setEngineId] = useState<EngineId>("chatgpt");
  const [model, setModel] = useState("");

  const engine = engineById(engineId);
  const models = useLlmModels(engine.modelsSlug, engine.defaultModels);

  const { authenticated } = usePrivy();
  const { login } = useLogin();
  const { priceOf } = useManifestPrices();
  const { state, run, hasWallet } = useEndpointRunner();

  // Keep the selected model valid as the engine (and its model list) changes.
  useEffect(() => {
    if (!models.includes(model)) setModel(models[0] ?? "");
  }, [models, model]);

  const basePrice = priceOf(engine.slug)?.usd;
  const priceLabel = basePrice ? `from $${basePrice.toFixed(basePrice < 0.01 ? 4 : 2)}` : null;

  const submit = () => {
    const user_prompt = prompt.trim();
    const model_name = model || models[0];
    if (!user_prompt || !model_name) return;
    run({ slug: engine.slug, method: "POST", body: { user_prompt, model_name } });
  };

  return (
    <div className="space-y-6">
      <AskForm
        prompt={prompt}
        onPromptChange={setPrompt}
        engineId={engineId}
        onEngineChange={setEngineId}
        models={models}
        model={model}
        onModelChange={setModel}
        onSubmit={submit}
        loading={state.status === "running"}
        priceLabel={priceLabel}
      />

      {state.status === "running" && <AskSkeleton />}

      {state.status === "needs-payment" && (
        <GeoPaywall
          subject={`${engine.label}'s answer for your prompt`}
          totalUsd={state.priceUsd || basePrice || 0}
          authenticated={authenticated}
          hasWallet={hasWallet}
          loading={false}
          onConnect={login}
          onPay={submit}
        />
      )}

      {state.status === "error" && (
        <AlertBanner
          variant="error"
          message={
            state.httpStatus ? `${state.message} (HTTP ${state.httpStatus})` : state.message
          }
        />
      )}

      {state.status === "success" && (
        <AskResponse
          engineId={engineId}
          data={state.data}
          amount={state.amount}
          source={state.source}
        />
      )}

      {state.status === "idle" && <AskEmpty />}
    </div>
  );
}
