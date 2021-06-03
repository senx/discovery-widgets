export class DiscoveryEvent {
  tags: string[];
  type: 'popup' | 'xpath' | 'style' | 'data' | 'variable';
  value: any;
  selector?: string;
}
