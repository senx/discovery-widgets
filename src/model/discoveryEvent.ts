export class DiscoveryEvent {
  tags: string[];
  type: 'popup' | 'xpath' | 'style' | 'data' | 'variable' | 'audio';
  value: any;
  selector?: string;
}
