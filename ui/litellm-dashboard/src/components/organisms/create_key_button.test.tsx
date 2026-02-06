import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, waitFor } from "../../../tests/test-utils";
import CreateKey from "./create_key_button";

const { formMock, setFieldsValueMock } = vi.hoisted(() => {
  const formMock = {
    setFieldsValue: vi.fn(),
    setFieldValue: vi.fn(),
    resetFields: vi.fn(),
  };
  return {
    formMock,
    setFieldsValueMock: formMock.setFieldsValue,
  };
});

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => ({
    accessToken: "test-token",
    userId: "test-user-id",
    userRole: "Admin",
    premiumUser: false,
  }),
}));

vi.mock("@/app/(dashboard)/hooks/keys/useKeys", () => ({
  keyKeys: {
    lists: () => ["keys"],
  },
}));

vi.mock("@ant-design/icons", () => ({
  InfoCircleOutlined: () => null,
}));

vi.mock("react-copy-to-clipboard", () => ({
  CopyToClipboard: ({ children }: { children: any }) => children,
}));

vi.mock("@tremor/react", () => {
  const React = require("react");
  const Stub = ({ children }: { children?: any }) => React.createElement("div", null, children);
  const Button = ({ children, ...props }: { children?: any }) =>
    React.createElement("button", props, children);
  const TextInput = (props: any) => React.createElement("input", props);

  return {
    Accordion: Stub,
    AccordionBody: Stub,
    AccordionHeader: Stub,
    Button,
    Col: Stub,
    Grid: Stub,
    Text: Stub,
    TextInput,
    Title: Stub,
  };
});

vi.mock("antd", () => {
  const React = require("react");

  const Form = ({ children, ...props }: { children?: any }) =>
    React.createElement("form", props, children);
  Form.Item = ({ children }: { children?: any }) => React.createElement(React.Fragment, null, children);
  Form.useForm = () => [formMock];

  const Select = ({ children, ...props }: { children?: any }) =>
    React.createElement("select", props, children);
  Select.Option = ({ children, ...props }: { children?: any }) =>
    React.createElement("option", props, children);

  const Input = (props: any) => React.createElement("input", props);
  Input.Password = (props: any) => React.createElement("input", { ...props, type: "password" });

  const Modal = ({ children, open }: { children?: any; open?: boolean }) =>
    open ? React.createElement("div", null, children) : null;

  const Radio = {
    Group: ({ children }: { children?: any }) => React.createElement("div", null, children),
  };

  const Switch = (props: any) => React.createElement("input", { ...props, type: "checkbox" });
  const Tooltip = ({ children }: { children?: any }) => React.createElement(React.Fragment, null, children);
  const Button = ({ children, ...props }: { children?: any }) =>
    React.createElement("button", props, children);

  return {
    Button,
    Form,
    Input,
    Modal,
    Radio,
    Select,
    Switch,
    Tooltip,
  };
});

vi.mock("../networking", () => ({
  keyCreateCall: vi.fn(),
  modelAvailableCall: vi.fn().mockResolvedValue({ data: [{ id: "gpt-4" }] }),
  getGuardrailsList: vi.fn().mockResolvedValue({ guardrails: [] }),
  getPromptsList: vi.fn().mockResolvedValue({ prompts: [] }),
  proxyBaseUrl: "http://localhost:4000",
  getPossibleUserRoles: vi.fn().mockResolvedValue({
    Admin: { ui_label: "Admin" },
    User: { ui_label: "User" },
  }),
  userFilterUICall: vi.fn().mockResolvedValue([]),
  keyCreateServiceAccountCall: vi.fn().mockResolvedValue({
    key: "test-service-account-key",
    soft_budget: null,
  }),
}));

vi.mock("../molecules/notifications_manager", () => ({
  default: {
    success: vi.fn(),
    fromBackend: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock("../agent_management/AgentSelector", () => ({ default: () => null }));
vi.mock("../common_components/budget_duration_dropdown", () => ({ default: () => null }));
vi.mock("../common_components/check_openapi_schema", () => ({ default: () => null }));
vi.mock("../common_components/KeyLifecycleSettings", () => ({ default: () => null }));
vi.mock("../common_components/ModelAliasManager", () => ({ default: () => null }));
vi.mock("../common_components/PassThroughRoutesSelector", () => ({ default: () => null }));
vi.mock("../common_components/PremiumLoggingSettings", () => ({ default: () => null }));
vi.mock("../common_components/RateLimitTypeFormItem", () => ({ default: () => null }));
vi.mock("../common_components/team_dropdown", () => ({ default: () => null }));
vi.mock("../create_user_button", () => ({ default: () => null }));
vi.mock("../mcp_server_management/MCPServerSelector", () => ({ default: () => null }));
vi.mock("../mcp_server_management/MCPToolPermissions", () => ({ default: () => null }));
vi.mock("../shared/numerical_input", () => ({ default: () => null }));
vi.mock("../vector_store_management/VectorStoreSelector", () => ({ default: () => null }));
vi.mock("../key_team_helpers/fetch_available_models_team_key", () => ({
  getModelDisplayName: (model: string) => model,
}));

describe("CreateKey", () => {
  const defaultProps = {
    team: null,
    teams: [],
    data: [],
    addKey: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should render the CreateKey component", () => {
    renderWithProviders(<CreateKey {...defaultProps} />);
    expect(screen.getByRole("button", { name: /create new key/i })).toBeInTheDocument();
  });

  it("should prefill models when provided without team_id", async () => {
    renderWithProviders(
      <CreateKey
        {...defaultProps}
        autoOpenCreate={true}
        prefillData={{
          models: ["gpt-4"],
        }}
      />,
    );

    await waitFor(() => {
      expect(setFieldsValueMock).toHaveBeenCalledWith({ models: ["gpt-4"] });
    });
  });
});
