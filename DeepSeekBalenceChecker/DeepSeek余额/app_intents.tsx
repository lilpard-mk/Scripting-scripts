import { AppIntentManager, AppIntentProtocol, Widget } from "scripting"

/**
 * You can use this intent in Widget like:
 * ```tsx
 * <Button
 *   title="Add"
 *   intent={MyIntent(5)}
 * />
 * ```
 */
export const MyIntent = AppIntentManager.register({
  name: "MyIntent",
  protocol: AppIntentProtocol.AppIntent,
  perform: async (
    /** Modify it to the type you need */
    params: number
  ) => {
    console.log("Number:", params)
    
    Widget.reloadAll()
  }
})
